const express = require('express')
const { MongoClient } = require('mongodb');
const SSLCommerzPayment = require('sslcommerz')
require('dotenv').config();
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

//sslcommerz init
app.post('/init', (req, res) => {
    const donationData = req.body;
    const data = {
        total_amount: donationData.amount,
        currency: 'USD',
        tran_id: 'REF123', // use unique tran_id for each api call
        success_url: 'http://localhost:5000/success',
        fail_url: 'http://localhost:5000/fail',
        cancel_url: 'http://localhost:5000/cancel',
        ipn_url: 'http://localhost:5000/ipn',
        shipping_method: 'Courier',
        product_name: 'Donation',
        product_category: 'Electronic',
        product_profile: 'general',
        cus_name: donationData.name,
        cus_email: donationData.email,
        cus_add1: 'Dhaka',
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: donationData.phone,
        cus_fax: '01711111111',
        ship_name: 'Customer Name',
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
    };
    const sslcz = new SSLCommerzPayment(process.env.STORE_ID,process.env.STORE_PASS,false)
    sslcz.init(data).then(apiResponse => {
        // Redirect the user to payment gateway
        if(apiResponse.GatewayPageURL){
            res.json(apiResponse)
        }else{
            return res.status(400).json({message:"Payment session failed"})
        } 

    });
})
app.post('/success', (req,res)=>{
    res.redirect('http://localhost:3000/success')
    res.status(200).json(req.body)

})
app.post('/fail', (req,res)=>{
    res.status(400).json(req.body)
})
app.post('/cancel', (req,res)=>{
    res.status(200).json(req.body)
})


// mongodb connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y7ez2.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const mongodbServer = async() =>{
    try{
        await client.connect()
        const database = client.db('Volunteer_network');
        const causesCollection = database.collection('causes');
        const eventsCollection = database.collection('events');
        const volunteerCollection = database.collection('volunteers');

        // get causes
        app.get('/causes', async(req,res)=>{
            const causes = await causesCollection.find({}).toArray()
            res.json(causes)
        })
        //get events
        app.get('/events', async(req,res)=>{
            const events = await eventsCollection.find({}).toArray()
            res.json(events)
        })
        // post volunteer data
        app.post('/volunteer', async(req,res)=>{
            const data = req.body;
            const response = await volunteerCollection.insertOne(data)
            res.json(response);
        })
        // get volunteer data
        app.get('/volunteer/:email', async(req,res)=>{
            const email = req.params.email
            const query = {email}
            const volunteer = await volunteerCollection.findOne(query)
            res.json(volunteer);
        })

    }
    finally{

    }

}
mongodbServer().catch(console.dir)

app.get('/',(req,res)=>{
    res.send('volunteer network node server is running')
});
app.listen( port, ()=>{
    console.log('server is running on port:', port);
});