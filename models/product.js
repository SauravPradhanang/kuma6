const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    reviews: {
        type: String,
        // required: true
    },
    richDescription: {
        type: String,
        default: ''
    },
    images: [{
        filename: String,
       
    }],
    price : {
        type: Number,
        default:0
    },
    category: {
        type: String,
        required: true
    },
    countInStock: {
        type: Number,
        required: true,
       // min: 0,
        //max: 2550
    },
    brand:{
        type: String,
        default: ''
    },
    rating: {
        type: Number,
        default: 0,
    },
    numReviews: {
        type: Number,
        default: 0,
    },
    dateCreated: {
        type: Date,
        default: Date.now,
    },
    rating:{
        type: Number,
        default: 0
    },
    numberOfRatings:{
        type: Number,
        default: 0
    },
    review: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Review',
    }],
     numberOfReviews:{
            type: Number,
            default: 0
        },
    variant:[{
        type: String,
        required: true
    }]
})

productSchema.index({name: "text", richDescription:"text", category:"text", brand:"text"});

productSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

productSchema.set('toJSON', {
    virtuals: true,
});

exports.Product = mongoose.model('Product', productSchema);
