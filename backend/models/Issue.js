const mongoose=require('mongoose');

const IssueSchema=new mongoose.Schema({
    title:{type:String,required:true},
    description:String,
    linkedExecutionId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Execution',
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    assignedTo:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    priority:{
        type:String,
        enum:['low','medium','high'],
        default:'medium'
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    isResolved:{ type:Boolean, default:false },
    resolutionInstructions:{ type:String },
    resolvedAt:{ type:Date },
    resolvedBy:{ type:mongoose.Schema.Types.ObjectId, ref:'User' }
});
module.exports=mongoose.model('Issue',IssueSchema);