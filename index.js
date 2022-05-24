const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;


// middlewares
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l4x92.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const partCollection = await client.db('certo_parts').collection('parts');
        const reviewCollection = await client.db('certo_parts').collection('reviews');
        const pricingCollection = await client.db('certo_parts').collection('pricings');
        const orderCollection = await client.db('certo_parts').collection('orders');

        // get all parts 
        app.get('/parts', async (req, res) => {
            const query = {};
            const parts = await partCollection.find(query).toArray();
            res.send(parts);
        })
        // get all reviews 
        app.get('/reviews', async(req, res) => {
            const query = {};
            const reviews = await reviewCollection.find(query).toArray();
            res.send(reviews);
        })
        
        // get all pricing services 
        app.get('/pricing', async(req, res) => {
            const query = {};
            const result = await pricingCollection.find(query).toArray();
            res.send(result);
        })

        // get a single parts 
        app.get('/parts/:id', async(req,res) => {
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const product = await partCollection.findOne(query);
            res.send(product)
        })

        //  order data insertOne
        app.post('/orders', async(req,res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result)
        }) 


    }
    catch (e) {
        console.log(e);
    }
    finally {
        // client.close();
    }

}

run().catch(console.dir);




    app.get('/', (req, res) => {
        res.send('Yah my bicycle server is running hey here ')
    })

    app.listen(port, () => {
        console.log('Listening to port', port)
    })

