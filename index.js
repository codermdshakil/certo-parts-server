const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
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

        // get all parts 
        app.get('/parts', async (req, res) => {
            const query = {};
            const parts = await partCollection.find(query).toArray();
            res.send(parts);
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
        res.send('Yah my bicycle server is running')
    })

    app.listen(port, () => {
        console.log('Listening to port', port)
    })

