const { Order } = require('../models/order');
const express = require('express');
const { OrderItem } = require('../models/order-item');
const router = express.Router();
const { Product } = require('../models/product');
const userDecoder = require('../helpers/user-decoder');
//const {User} = require('../models/user');

router.delete(`/:id`, userDecoder,async (req, res) => {
    const cartItem = await OrderItem.findById(req.params.id).populate({ path: 'product' });
    const product = await Product.findById(cartItem.product.id);

    /*
    OrderItem.findByIdAndRemove(req.params.id).then(item => {
        if (item) {
            return res.redirect('/order-items');
            //return res.status(200).json({success: true, message: 'the product is deleted!'})
        }
    }).catch(err => {
        return res.status(500).json({ success: false, error: err })
    })*/

    product.countInStock+=cartItem.quantity;
    await product.save();
    
    await OrderItem.findByIdAndDelete(req.params.id);

    return res.send('deleted');
})

router.put(`/:id`, userDecoder, async (req, res) => {

    const cartItem = await OrderItem.findById(req.params.id).populate({ path: 'product' });
    const product = await Product.findById(cartItem.product.id);

    const oldQuantity = cartItem.quantity;
    //const product = await Product.findById(req.params.id).populate('category');
    const newQuantity = parseInt(req.body.quantity, 10);

    console.log(newQuantity);
    console.log(oldQuantity);

    /*
    const orderItem = await OrderItem.findByIdAndUpdate(req.params.id, {
        quantity: newQuantity
    }, { new: true })*/
    cartItem.quantity = newQuantity;
    await cartItem.save();


    if (newQuantity > oldQuantity) {
        product.countInStock -= (newQuantity - oldQuantity);
    }
    if (oldQuantity > newQuantity) {
        product.countInStock += (oldQuantity - newQuantity);
    }

    await product.save();

    //if (!orderItem) { return res.status(400).send('the user cannot be created!'); }

    //return res.redirect(`/order-items`);
    return res.send('updated');
})

router.post(`/:id`, userDecoder, async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category');
    const cartItem = await OrderItem.findOne({ product: req.params.id, user: req.userId, session: 'active' });

    //const id= req.userId;
    //console.log(`${id}`);
    //console.log(req.body.quantity);

    if (req.body.quantity <= product.countInStock) {
        console.log(cartItem);
        if (cartItem) {
            cartItem.quantity += parseInt(req.body.quantity, 10);
            await cartItem.save();

            product.countInStock -= parseInt(req.body.quantity, 10);
            await product.save();
        }

        else {
            const cartItem = new OrderItem({
                quantity: req.body.quantity,
                product: req.params.id,
                user: req.userId
            })
            await cartItem.save();

            product.countInStock -= parseInt(req.body.quantity, 10);
            await product.save();
        }

        //console.log(ci);

        /*
        if (!cartItem.) {
                cartItem = await cartItem.save();
            }*/

        /* if (!cartItem)
             return res.status(400).send('no order placed. cart is empty !')*/

        //res.redirect('/products/login');
        //res.send(user);


        console.log(cartItem);
        console.log(req.body.quantity);

        return res.status(200).json({ message: "Item added to cart" });
    }
    else {
        return res.status(400).json({message: "Insufficent items in store."});
    }

})

//testing route only
router.get('/placeorder', (req, res) => {
    res.render('order');
})

//actual route
router.get('/', userDecoder, async (req, res) => {

    //const user = await User.findById(req.userId);
    const orderedItems = await OrderItem.find({ user: req.userId, session: 'active' }).populate("product");

    console.log(orderedItems);
   

    let subTotal=0;
    orderedItems.forEach(orderedItem=>{
        subTotal= subTotal+orderedItem.product.price*orderedItem.quantity
    })
    
    let taxAmount= 0.13*subTotal;
    let deilveryCost= 0.1*subTotal;
    let totalPrice= subTotal+taxAmount+deilveryCost;

    res.render('cart', { orderedItems, taxAmount, deilveryCost, totalPrice, subTotal });
})

module.exports = router;