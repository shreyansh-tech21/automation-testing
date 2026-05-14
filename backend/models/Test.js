const mongoose=require('mongoose');

const StepSchema=new mongoose.Schema({
    //UI fields (existing)
    label:String,
    action:String,
    value:String,
    expected:String,
    type:String,

    //API fields
    name:String,
    method:String,
    url:String,
    headers:mongoose.Schema.Types.Mixed,
    body:mongoose.Schema.Types.Mixed,
    extract:mongoose.Schema.Types.Mixed,
    assert:mongoose.Schema.Types.Mixed,
}, { _id: false });

const TestSchema=new mongoose.Schema({
    name:String,
    url:String,
    profile:String,
    testType:{
        type:String,
        enum:['ui','api'],
        default:'ui'
    },
    baseUrl:String,
    steps:[StepSchema]
});

module.exports=mongoose.model('Test',TestSchema);