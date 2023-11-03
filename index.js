const express = require('express');
const cors = require('cors')
var jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const app = express();
const port = process.env.PORT || 5000
//middle ware
app.use(cors({
    origin: ['https://plan-a-plant.web.app', 'https://plan-a-plant.firebaseapp.com'],
    credentials: true
  }));
app.use(express.json());
app.use(cookieParser());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o19wwr0.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// middlewares 
const logger = (req, res, next) =>{
    console.log('log: info', req.method, req.url);
    next();
}

const verifyToken = (req, res, next) =>{
    const token = req?.cookies?.token;
    // console.log('token in the middleware', token);
    // no token available 
    if(!token){
        return res.status(401).send({message: 'unauthorized access'})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
        if(err){
            return res.status(401).send({message: 'unauthorized access'})
        }
        req.user = decoded;
        next();
    })
}

async function run() {
    try {

        const database = client.db("plantDB");
        const plantCollection = database.collection("plants")
        const cartcollection = database.collection("cart")
        const ordercollection = database.collection("order")
        const userCollection = database.collection("user")

        // auth related apis
        app.post('/jwt', logger, async (req, res) => {
            const user = req.body;
            console.log('user for token', user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
            })
                .send({ success: true });
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user);
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })





        app.post('/plants', async (req, res) => {
            const plant = req.body;
            console.log(plant)
            const result = await plantCollection.insertOne(plant);
            res.send(result)
        })

        app.get('/plants', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
      
            console.log('pagination query', page, size);
            const result = await plantCollection.find()
            .skip(page * size)
            .limit(size)
            .toArray();
            res.send(result);
        })
        // app.get('/plants', async (req, res) => {
        //     const page = parseInt(req.query.page) || 0;
        //     const limit = parseInt(req.query.limit) || 5;
        //     const skip = page * limit;


        //     const cursor = plantCollection.find().skip(skip).limit(limit)
        //     const result = await cursor.toArray();
        //     res.send(result)
        // })

        app.get('/plants/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const plants = await plantCollection.findOne(query)
            res.send(plants)
        })

        // get the total number of product
        app.get('/plantscount', async(req, res)=>{
            const count = await plantCollection.estimatedDocumentCount();
            res.send({count})
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

        app.delete('/plants/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await plantCollection.deleteOne(query)
            res.send(result)
        })

        // cart collection 

        app.post('/cart', async (req, res) => {
            const cart = req.body;
            console.log(cart)
            const result = await cartcollection.insertOne(cart);
            res.send(result)
        })

        app.get('/cart', logger, verifyToken, async(req, res)=>{
            console.log(req.query.email);
                 // console.log('ttttt token', req.cookies.token)
                 console.log('user in the valid token', req.user)
                 if(req.query.email !== req.user.email){
                     return res.status(403).send({message: 'forbidden access'})
                 }
     
                 let query = {};
                 if (req.query?.email) {
                     query = { email: req.query.email }
                 }
           const cursor = cartcollection.find(query);
           const result = await cursor.toArray();
           res.send(result)
         })

        app.delete('/cart/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await cartcollection.deleteOne(query)
            res.send(result)
        })


        // billing api

        app.post('/order', async (req, res) => {
            const plant = req.body;
            console.log(plant)
            const result = await ordercollection.insertOne(plant);
            res.send(result)
        })

        app.get('/order', logger, async(req, res)=>{
            const cursor = ordercollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        // user

        app.post('/user', async (req, res) => {
            const cart = req.body;
            console.log(cart)
            const result = await userCollection.insertOne(cart);
            res.send(result)
        })

        app.get('/user', logger, async(req, res)=>{
            const cursor = userCollection.find();
            const result = await cursor.toArray();
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