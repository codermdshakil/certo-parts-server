const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


// middlewares
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l4x92.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_SECRET_TOEKN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}



async function run() {
    try {
        await client.connect();
        const usersCollection = await client.db('certo_parts').collection('users');
        const partCollection = await client.db('certo_parts').collection('parts');
        const reviewCollection = await client.db('certo_parts').collection('reviews');
        const pricingCollection = await client.db('certo_parts').collection('pricings');
        const orderCollection = await client.db('certo_parts').collection('orders');
        const userInformationCollection = await client.db('certo_parts').collection('userInformation');
        const paymentCollection = await client.db('certo_parts').collection('allpayments');

        app.post('/create-payment-intent', verifyJWT, async (req, res) => {
            const book = req.body;
            const price = book.productPrice;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ['card']

            });

            res.send({ clientSecret: paymentIntent.client_secret })
        });



        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);

            const token = jwt.sign({ email: email }, process.env.ACCESS_SECRET_TOEKN, { expiresIn: '1h' })
            res.send({ result, token });

        })

        // get all parts 
        app.get('/parts', async (req, res) => {
            const query = {};
            const parts = await partCollection.find(query).toArray();
            res.send(parts);
        })

        // all a product 
        app.post('/parts', async (req, res) => {
            const newProduct = req.body;
            console.log(newProduct)
            const result = await partCollection.insertOne(newProduct);
            res.send(result)
        })

        // delete product 
        app.delete('/parts/:id',verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await partCollection.deleteOne(query);
            res.send(result);
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
        app.get('/orders', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (decodedEmail == email) {
                const query = { email: email };
                const result = await orderCollection.find(query).toArray();
                return res.send(result);
            }
            else {
                return res.status(403).send({ message: "Forbidden access" })
            }
        })

        // get all orders 
        app.get('/allorders', async (req, res) => {
            const query = {};
            const result = await orderCollection.find(query).toArray();
            res.send(result);
        })


        app.get('/orders/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.findOne(query);
            res.send(result);

        })

        app.patch('/orders/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            console.log(payment)
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    paid: true,
                    status: "Pending",
                    transactionId: payment.transactionId
                }
            }
            const insetToPayments = await paymentCollection.insertOne(payment);
            const result = await orderCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        // update product status
        app.put('/orders/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const updatedStatus = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: updatedStatus.status,
                }
            }
            const result = await orderCollection.updateOne(filter, updateDoc, options);
            res.send(result);

        })


        // delete a order 
        app.delete('/orders/:id', verifyJWT, async (req, res) => {
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
        app.get('/userInfo/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email };
            const result = await userInformationCollection.findOne(query);
            res.send(result);
        })

        // get all users 
        app.get('/users', async (req, res) => {
            const query = {};
            const result = await usersCollection.find(query).toArray();
            res.send(result)
        })

        app.put('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await usersCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await usersCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
            else {
                res.status(403).send({ message: 'forbidden' });
            }

        })

        // get admin
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await usersCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin });
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

