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
    similarityScore:Number,
    // UI step: action, value, expected, type (match test step form)
    action:String,
    filledValue:String,
    expected:String,
    type:String,
    // API step: input parameters that were sent
    request:mongoose.Schema.Types.Mixed,
    response:mongoose.Schema.Types.Mixed,
    responseStatus:Number,
    assertionFailureReason:String,
});

const ExecutionSchema=new mongoose.Schema({
    testId:String,
    testName:String,
    profile:String,
    type:{ type:String, default:'ui' },
    url:String,
    results:[StepResultSchema],
    overallStatus:String,
    createdAt:{
        type:Date,
        default:Date.now
    }
});

module.exports=mongoose.model('Execution',ExecutionSchema);
