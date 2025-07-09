const { Order } = require('../models/order');
const express = require('express');
const { OrderItem } = require('../models/order-item');
const userDecoder = require('../helpers/user-decoder');
const { populate } = require('dotenv');
//const { populate } = require('dotenv');
const router = express.Router();
//const fetch = require('node-fetch');


router.get('/', (req, res) => {
    res.render('orderPlace');
})

router.get('/order-history', userDecoder, async (req, res) => {

    const orders = await Order.find({ user: req.userId, existence: 'paid' }).sort({ dateOrdered: -1 }).populate({ path: 'orderItems', populate: { path: 'product' } });
    console.log(orders);
    res.render('order-history', { orders });
})


router.get('/khalti-done',userDecoder, async (req, res) => {

    const pidx = req.query.pidx;
    console.log(pidx);
    //const tidx= req.params.tidx;
    try {
        const response = await fetch('https://dev.khalti.com/api/v2/epayment/lookup/', {
            method: 'POST',
            body: JSON.stringify({
                "pidx": pidx,
                //"tidx": tidx
            }),
            headers: {
                'Authorization': process.env.khalti_key,
                'Content-Type': 'application/json',
            }
        })
        const data= await response.json();
        if(data.status==='Completed'){

            const orderedItems = await OrderItem.find({ user: req.userId, session: 'active' }).populate({ path: 'product' });
            const order = await Order.findOne({ user: req.userId, existence: 'temp' }).sort({ dateOrdered: -1 });

            order.existence= 'paid';
            await order.save();
             
    orderedItems.forEach(async (orderItem)=>{
        orderItem.session= 'inactive'
        await orderItem.save();
    })


            //return res.send('Payment success!!')
            return res.redirect('/orders/order-history');
        }else{
            return res.redirect('/order-items/')
        }
        console.log(data);
    } catch (err) {
        console.log(err);
    }


})



router.get(`/:id`, async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name')
        .populate({
            path: 'orderItems', populate: {
                path: 'product', populate: 'category'
            }
        });

    if (!order) {
        res.status(500).json({ success: false })
    }
    res.send(order);
})

router.post('/', userDecoder, async (req, res)=>{
    const orderedItems = await OrderItem.find({ user: req.userId, session: 'active' }).populate({ path: 'product' });
    const orderedItemsId = await orderedItems.map((orderedItem) => orderedItem.id);

    let order = new Order({
        orderItems: orderedItemsId,
        streetAddress: req.body.street,
        city: req.body.city,
        
        phone: req.body.phoneNo,
        user: req.userId,
        totalPrice: req.body.totaldisplay
    })

    order = await order.save();
    const khaltiPrice= (parseInt(req.body.totaldisplay)*100);
    try {
        const response = await fetch('https://dev.khalti.com/api/v2/epayment/initiate/', {
            method: 'POST',
            body: JSON.stringify({
                "return_url": "http://localhost:3000/orders/khalti-done",
                "website_url": "http://localhost:3000/",
                "amount": khaltiPrice,
                "purchase_order_id": order.id,
                "purchase_order_name": "Order",
            }),
            headers: {
                'Authorization': process.env.khalti_key,
                'Content-Type': 'application/json',
            }
        });

       if (response.ok) {
            // Parse the JSON response
            const data = await response.json();
            console.log(data); // Ensure data is correctly logged

            // Redirect to the Khalti payment URL
            //window.location.href = data.payment_url;
            res.redirect(data.payment_url);
        } else {
            res.redirect('/order-items/')
            throw new Error('Payment initiation failed');
        }
    } catch (err) {
        console.log(err);
        res.send('Error procesing request.')
        //alert('Error processing request');
    }

})

router.post('/random', userDecoder, async (req, res) => {

    console.log(req.userId);
    const orderedItems = await OrderItem.find({ user: req.userId, session: 'active' }).populate({ path: 'product' });
    const orderedItemsId = await orderedItems.map((orderedItem) => orderedItem.id);

    console.log(orderedItems);
    console.log(orderedItemsId);

    let totalPrice = 0;
    orderedItems.forEach((orderedItem) => {
        totalPrice = totalPrice + orderedItem.quantity * orderedItem.product.price;
    })

    let order = new Order({
        orderItems: orderedItemsId,
        streetAddress: req.body.street,
        city: req.body.city,
        
        phone: req.body.phoneNo,
        user: req.userId,
        totalPrice: totalPrice
    })

    order = await order.save();
    order = await order.populate({ path: 'orderItems', populate: { path: 'product' } });

    
    orderedItems.forEach(async (orderItem)=>{
        orderItem.session= 'inactive'
        await orderItem.save();
    })

    console.log(order.id);

    const khaltiPrice= totalPrice*100;
    try {
        const response = await fetch('https://dev.khalti.com/api/v2/epayment/initiate/', {
            method: 'POST',
            body: JSON.stringify({
                "return_url": "http://localhost:3000/orders/khalti-done",
                "website_url": "http://localhost:3000/",
                "amount": khaltiPrice,
                "purchase_order_id": order.id,
                "purchase_order_name": "Order",
            }),
            headers: {
                'Authorization': process.env.khalti_key,
                'Content-Type': 'application/json',
            }
        });

       if (response.ok) {
            // Parse the JSON response
            const data = await response.json();
            console.log(data); // Ensure data is correctly logged

            // Redirect to the Khalti payment URL
            //window.location.href = data.payment_url;
            res.redirect(data.payment_url);
        } else {
            throw new Error('Payment initiation failed');
        }
    } catch (err) {
        console.log(err);
        res.send('Error procesing request.')
        //alert('Error processing request');
    }

   // return res.render('orderConfirmation', { order })

    //return res.render('orderConfirmation', {order});
    //res.redirect('/orders/order-history');
    //res.send('hey');

})



module.exports = router;