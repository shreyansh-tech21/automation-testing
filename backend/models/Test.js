const mongoose=require('mongoose');

const StepSchema=new mongoose.Schema({
    label:String,
    action:String,
    value:String,
    expected:String,
    type:String
});

const TestSchema=new mongoose.Schema({
    name:String,
    url:String,
    profile:String,
    steps:[StepSchema]
});

module.exports=mongoose.model('Test',TestSchema);