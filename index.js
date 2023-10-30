const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
require('dotenv').config()

const app = express();
const port = process.env.PORT || 5000
//middle ware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o19wwr0.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        const database = client.db("plantDB");
        const plantCollection = database.collection("plants")

        app.post('/plants', async (req, res) => {
            const plant = req.body;
            console.log(plant)
            const result = await plantCollection.insertOne(plant);
            res.send(result)
        })

        app.get('/plants', async (req, res) => {
            const cursor = plantCollection.find()
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/plants/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const plants = await plantCollection.findOne(query)
            res.send(plants)
        })

        app.put('/plants/:id', async (req, res) => {
            const id = req.params.id;
            const plants = req.body;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updatePlants = {
                $set: {
                    name: plants.name,
                    photo: plants.photo,
                    category: plants.category,
                    producttype: plants.producttype,
                    price: plants.price,
                    description: plants.description,
                    rating: plants.rating,
            }
            }
            const result = await plantCollection.updateOne(filter, updatePlants, options)
            res.send(result)
        })




        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('plant shop is running')
})
app.listen(port, () => {
    console.log('plant shop server is running on port ', port)
})