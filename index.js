const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


// middleware 
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.szh9b4v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        const queryCollections = client.db('alternativeProducts').collection('queries');
        const recommendCollections = client.db('alternativeProducts').collection('recommendation');

        // crud for recommendation
        app.post('/recommendation', async(req, res)=>{
            const recommendation = req.body;
            console.log(recommendation);
            const result = await recommendCollections.insertOne(recommendation);
            res.send(result)
        })

        // crud for queries
        app.get('/queries', async (req, res) => {
            // console.log(req.query.userEmail)
            let query = {};
            if (req.query?.userEmail) {
                query = { userEmail: req.query.userEmail }
            }
            const result = await queryCollections.find(query).toArray();
            res.send(result)
        })

        app.get('/queries/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await queryCollections.findOne(query);
            res.send(result)
        })

        app.post('/queries', async (req, res) => {
            const queries = req.body;
            console.log(queries);
            const result = await queryCollections.insertOne(queries);
            res.send(result)
        })

        app.put('/queries/:id', async (req, res) => {
            const id = req.params.id;
            const singleQuery = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    product_name : singleQuery.product_name,
                    brand_name : singleQuery.brand_name,
                    product_image : singleQuery.product_image,
                    query_title : singleQuery.query_title,
                    boycotting_reason : singleQuery.boycotting_reason
                }
            }
            const result = await queryCollections.updateOne(filter, updateDoc, options);
            res.send(result)
        })

        app.delete('/deleteQuery/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await queryCollections.deleteOne(query);
            res.send(result)
        })

        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Alternative Product Server is running')
})

app.listen(port, () => {
    console.log(`alternative-product listening on port ${port}`)
})