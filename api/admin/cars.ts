import type {VercelRequest,VercelResponse} from "../../lib/vercel-types";
import {z} from "zod";
import {db} from "../../lib/db";
import {check,originOk} from "../../lib/auth";

const carSchema=z.object({
  brand:z.string().min(1).max(80),
  model:z.string().min(1).max(100),
  trim:z.string().max(160),
  price_eur:z.number().int().positive(),
  year:z.number().int().min(1950).max(new Date().getFullYear()+1),
  mileage_km:z.number().int().min(0),
  fuel:z.string().min(1).max(30),
  transmission:z.string().min(1).max(30),
  body_type:z.string().max(40),
  description:z.string().max(4000),
  image_urls:z.array(z.string().url()).max(8)
});
const idSchema=z.string().uuid();

export default async function handler(req:VercelRequest,res:VercelResponse){
  if(!(await check(req)))return res.status(401).json({error:"No autorizado"});
  try{
    const pool=db();
    if(req.method==="GET"){
      const result=await pool.query("SELECT * FROM cars ORDER BY active DESC,created_at DESC");
      return res.status(200).json(result.rows);
    }
    if(!originOk(req))return res.status(403).end();

    if(req.method==="POST"){
      const parsed=carSchema.safeParse(req.body);
      if(!parsed.success)return res.status(400).json({error:"Revisa los datos"});
      const car=parsed.data;
      const result=await pool.query(
        "INSERT INTO cars(brand,model,trim,price_eur,year,mileage_km,fuel,transmission,body_type,description,image_urls,active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true) RETURNING id,active",
        [car.brand,car.model,car.trim,car.price_eur,car.year,car.mileage_km,car.fuel,car.transmission,car.body_type,car.description,car.image_urls]
      );
      return res.status(201).json(result.rows[0]);
    }

    if(req.method==="PUT"){
      const parsed=z.object({id:idSchema,...carSchema.shape}).safeParse(req.body);
      if(!parsed.success)return res.status(400).json({error:"Revisa los datos"});
      const car=parsed.data;
      const result=await pool.query(
        "UPDATE cars SET brand=$2,model=$3,trim=$4,price_eur=$5,year=$6,mileage_km=$7,fuel=$8,transmission=$9,body_type=$10,description=$11,image_urls=$12,updated_at=now() WHERE id=$1 RETURNING id,active",
        [car.id,car.brand,car.model,car.trim,car.price_eur,car.year,car.mileage_km,car.fuel,car.transmission,car.body_type,car.description,car.image_urls]
      );
      if(!result.rowCount)return res.status(404).json({error:"Vehículo no encontrado"});
      return res.status(200).json(result.rows[0]);
    }

    if(req.method==="PATCH"){
      const parsed=z.object({id:idSchema,active:z.boolean()}).safeParse(req.body);
      if(!parsed.success)return res.status(400).json({error:"Estado no válido"});
      const result=await pool.query("UPDATE cars SET active=$2,updated_at=now() WHERE id=$1 RETURNING id,active",[parsed.data.id,parsed.data.active]);
      if(!result.rowCount)return res.status(404).json({error:"Vehículo no encontrado"});
      return res.status(200).json(result.rows[0]);
    }

    if(req.method==="DELETE"){
      const id=idSchema.safeParse(String(req.query.id||""));
      if(!id.success)return res.status(400).json({error:"ID no válido"});
      const result=await pool.query("UPDATE cars SET active=false,updated_at=now() WHERE id=$1 RETURNING id,active",[id.data]);
      if(!result.rowCount)return res.status(404).json({error:"Vehículo no encontrado"});
      return res.status(200).json(result.rows[0]);
    }

    return res.status(405).end();
  }catch{return res.status(503).json({error:"No se pudo acceder al inventario"})}
}
