const mongoose=require('mongoose');

const StepResultSchema=new mongoose.Schema({
    label:String,
    status:String,
    error:String,
    screenshot:String,
    healed:{
        type:Boolean,
        default:false
    },
    healStrategy:String,
    similarityScore:Number
});

const ExecutionSchema=new mongoose.Schema({
    testId:String,
    testName:String,
    profile:String,
    results:[StepResultSchema],
    overallStatus:String,
    createdAt:{
        type:Date,
        default:Date.now
    }
});

module.exports=mongoose.model('Execution',ExecutionSchema);
