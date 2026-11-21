import type {VercelRequest,VercelResponse} from "../lib/vercel-types";
import {Resend} from "resend";
import {z} from "zod";
import {allowed} from "../lib/limit";

const schema=z.object({
  name:z.string().min(2).max(100),
  email:z.string().email().max(254),
  phone:z.string().max(30).optional(),
  message:z.string().min(4).max(2500),
  website:z.string().max(0).optional(),
  cv:z.object({filename:z.string().min(5).max(180),contentType:z.string().max(120),content:z.string().min(100).max(1_400_000)})
});
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]!));
const types:Record<string,{mime:string;signature:(b:Buffer)=>boolean}>={
  pdf:{mime:"application/pdf",signature:b=>b.subarray(0,5).toString()==="%PDF-"},
  doc:{mime:"application/msword",signature:b=>b.subarray(0,8).equals(Buffer.from([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]))},
  docx:{mime:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",signature:b=>b.subarray(0,2).toString()==="PK"}
};

export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method!=="POST")return res.status(405).end();
  if(req.headers.origin!==process.env.APP_URL)return res.status(403).end();
  try{
    if(!(await allowed(req,"contact")))return res.status(429).json({error:"Espera antes de enviar otra candidatura"});
    const parsed=schema.safeParse(req.body);
    if(!parsed.success)return res.status(400).json({error:"Revisa los campos y adjunta tu CV"});
    if(parsed.data.website)return res.status(200).json({ok:true});
    const {name,email,phone,message,cv}=parsed.data;
    const extension=cv.filename.split(".").pop()?.toLowerCase()||"",fileType=types[extension];
    if(!fileType||cv.contentType&&cv.contentType!==fileType.mime)return res.status(400).json({error:"Formato de CV no válido"});
    if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(cv.content))return res.status(400).json({error:"El CV no es válido"});
    const bytes=Buffer.from(cv.content,"base64");
    if(bytes.length>1024*1024||!fileType.signature(bytes))return res.status(400).json({error:"El CV no es válido o supera 1 MB"});
    const filename=cv.filename.split(/[\\/]/).pop()!.replace(/[^\p{L}\p{N}._ -]/gu,"_");
    const key=process.env.RESEND_API_KEY,to=(process.env.CONTACT_TO||"").split(",").map((x:string)=>x.trim()).filter(Boolean),from=process.env.EMAIL_FROM;
    if(!key||!to.length||!from)return res.status(503).json({error:"Correo no configurado"});
    const mail=new Resend(key);
    const result=await mail.emails.send({from,to,replyTo:email,subject:"AUTO VERSE · Nueva candidatura",html:"<h2>Nueva candidatura desde la web</h2><p><b>Nombre:</b> "+esc(name)+"</p><p><b>Email:</b> "+esc(email)+"</p><p><b>Teléfono:</b> "+esc(phone||"No indicado")+"</p><p><b>Mensaje:</b></p><p>"+esc(message).replace(/\n/g,"<br>")+"</p><p>CV adjunto: "+esc(filename)+"</p>",attachments:[{filename,content:bytes,content_type:fileType.mime}]});
    if(result.error)return res.status(502).json({error:"No se pudo enviar"});
    return res.status(200).json({ok:true});
  }catch{return res.status(503).json({error:"Servicio no disponible"})}
}
