const mariadb = require('mariadb');
const express = require('express');
var cors = require('cors')
const app = express();
 
app.use(cors())

app.get("/Solar",async (req,res) =>{

    res.send(await getPlantNames("Solar_Plants"))
})

app.get("/Wind",async (req,res) =>{

    res.send(await getPlantNames("Wind_Plants"))
})

app.get("/Hydro", async (req,res) =>{

    res.send(await getPlantNames("Hydro_Plants"))
})

app.get("/Graphs/:id",async (req,res)=>{
    let r = {
        income : await getIncomeGraphPlant(req.params.id),
        energy : await getEnergyGraphPlant(req.params.id)
    }

    res.send(r)
})



app.listen(8080,()=>{
    console.log("listening on port 8080")
})


const pool = mariadb.createPool(
    {
    port:3306,
    user:"user1",
    password:"password1",
    connectionLimit: 5,
    }
)



async function getPlantNames(plantType){

    let plants = []

    return pool.getConnection()
    .then(async conn=>{

        await conn.query("use TexasPower;");

        let query = `select \`name\`, plant_id from Plant join ${plantType} on Plant.plant_id = ${plantType}.plant`;

        let rows = await conn.query(query);
        
        rows.forEach((row)=>{
            
            let plant = {
                plant_id:row.plant_id,
                name:row.name
            }
            
            plants.push(plant)
        })
        conn.close();
        return plants;
    }).catch((err)=>{
        console.log(err)
    })

  
}


async function getEnergyGraphPlant(plantId) {
    
    let data = []

    return pool.getConnection()
    .then(async conn=>{

        await conn.query("use TexasPower;");

        let query = `Select kilowatts_produced, date 
        from Plant join Energy_Produced E on Plant.plant_id = E.plant
        where Plant.plant_id = ${plantId};`;
        

        let rows = await conn.query(query);
        
        rows.forEach((row)=>{
            
            data.push(row)

        })

        conn.close();

        return data;

    }).catch((err)=>{
        console.log(err)
    })


}

function getIncomeGraphPlant(plantId){

    let data = []

    return pool.getConnection()
    .then(async conn=>{

        await conn.query("use TexasPower;");

        let query = 
        `SELECT Energy_sold.date, ROUND(CAST(kilowatts_sold AS DECIMAL(7, 2)) * CAST(dollar_per_kilowatt AS DECIMAL(7, 2)), 2) AS 'total_income_per_day'
        FROM Energy_sold join Plant on Plant.plant_id = Energy_sold.plant
        where Plant.plant_id = ${plantId};`

        

        let rows = await conn.query(query);
        
        rows.forEach((row)=>{
            
            data.push(row)

        })
        conn.close();
        return data;

    }).catch((err)=>{
        console.log(err)
    })

}

