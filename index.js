const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


// middleware 
app.use(cors({
    origin: [
        'http://localhost:5173'
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.szh9b4v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// middleware

const verifyToken = async(req, res, next)=>{
    const token = req.cookies?.token;
    // console.log('value of token in middleware: ', token)
    if(!token){
        return res.status(401).send({message: 'unauthorized access'})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
            console.log(err)
            return res.status(401).send({message:'unauthorized'})
        }
        req.user = decoded
        next()
    })
}

async function run() {
    try {
        const queryCollections = client.db('alternativeProducts').collection('queries');
        const recommendCollections = client.db('alternativeProducts').collection('recommendation');


        // auth related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            // console.log('user login for token', user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none'
                })
                .send({ success: true })
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            // console.log('logout user :', user)
            res
                .clearCookie('token', { maxAge: 0 })
                .send({ success: true })
        })



        // crud for recommendation
        app.get('/recommendation', async (req, res) => {
            let query = {};
            if (req.query?.queryId) {
                query = { queryId: req.query.queryId }
            }
            const result = await recommendCollections.find(query).toArray();
            res.send(result)
        })

        // my recommendation
        app.get('/myRecommendation/:email', async (req, res) => {
            const email = req.params.email;
            const query = { recommenderEmail: email };
            const result = await recommendCollections.find(query).toArray();
            res.send(result)
        })

        // recommendation for me
        app.get('/recommendForMe/:email', async (req, res) => {
            const email = req.params.email;
            const query = { creatorEmail: email };
            const result = await recommendCollections.find(query).toArray();
            res.send(result)
        })

        app.post('/recommendation', async (req, res) => {
            const recommendation = req.body;
            console.log(recommendation);
            const result = await recommendCollections.insertOne(recommendation);
            res.send(result)
        })

        app.delete('/deleteComment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await recommendCollections.deleteOne(query);
            res.send(result)
        })

        // crud for queries
        app.get('/queries', async(req,res)=>{
            const result = await queryCollections.find().sort({_id: -1}).toArray();
            res.send(result)
        })
        app.get('/myQueries/:email', verifyToken, async (req, res) => {
            if(req.user.email !== req.params.email){
                return res.status(403).send({message: 'forbidden'})
            }
            // console.log(req.user.email)
            // console.log(req.params.email)
            const email = req.params.email;
            const query = { userEmail: email };
            const result = await queryCollections.find(query).sort({_id: -1}).toArray();
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
                    product_name: singleQuery.product_name,
                    brand_name: singleQuery.brand_name,
                    product_image: singleQuery.product_image,
                    query_title: singleQuery.query_title,
                    boycotting_reason: singleQuery.boycotting_reason
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