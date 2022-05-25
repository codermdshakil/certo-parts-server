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
        const userInformationCollection = await client.db('certo_parts').collection('userInformation');

        // get all parts 
        app.get('/parts', async (req, res) => {
            const query = {};
            const parts = await partCollection.find(query).toArray();
            res.send(parts);
        })
        // get all reviews 
        app.get('/reviews', async (req, res) => {
            const query = {};
            const reviews = await reviewCollection.find(query).toArray();
            res.send(reviews);
        })

        // get all pricing services 
        app.get('/pricing', async (req, res) => {
            const query = {};
            const result = await pricingCollection.find(query).toArray();
            res.send(result);
        })

        // get a single parts 
        app.get('/parts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await partCollection.findOne(query);
            res.send(product)
        })

        //  order data insertOne
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result)
        })

        // get all order on email based 
        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await orderCollection.find(query).toArray();
            res.send(result);
        })

        // delete a order 
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        })

        // insetOne review 
        app.post('/reviews', async (req, res) => {
            const newReview = req.body;
            const result = await reviewCollection.insertOne(newReview);
            res.send(result);
        })

        // userInformation 
        app.put('/userInfo/:email', async (req, res) => {
            const email = req.params.email;
            const userInfo = req.body;
            const filter = { userEmail: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    userName: userInfo.userName,
                    userEmail: userInfo.userEmail,
                    userPhone: userInfo.userPhone,
                    userImg: userInfo.userImg,
                    userEducation: userInfo.userEducation,
                    userAddress: userInfo.userAddress,
                    userLocation: userInfo.userLocation,
                    userLinkedinUrl: userInfo.userLinkedinUrl,
                }
            }

            const result = await userInformationCollection.updateOne(filter, updateDoc, options);
            res.send(result);

        })

        // get updated user 
        app.get('/userInfo/:email', async (req, res) => {
            const email = req.params.email;
            const query = {userEmail:email};
            const result = await userInformationCollection.findOne(query);
            res.send(result);
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
    res.send('Yah my bicycle server is running ')
})

app.listen(port, () => {
    console.log('Listening to port', port)
})

