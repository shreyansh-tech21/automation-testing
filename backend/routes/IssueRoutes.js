const express=require('express');
const Issue=require('../models/Issue');
const auth=require('../middleware/authMiddleware');
const allowRoles=require('../middleware/roleMiddleware');

const router=express.Router();

router.post(
    "/",
    auth,
    allowRoles('admin','tester'),
    async (req,res)=>{
        const issue=await Issue.create({
            ...req.body,
            createdBy:req.user.id,
            isResolved:false,
        });
        res.json(issue);
    }
);

router.get("/",auth,async (req,res)=>{
    const statusParam=req.query.status;
    const query={};
    if (statusParam==='open' || statusParam==='pending') query.isResolved=false;
    else if (statusParam==='resolved') query.isResolved=true;
    const issues=await Issue.find(query)
    .populate('assignedTo',"name email")
    .populate('createdBy',"name email")
    .populate("linkedExecutionId","testName overallStatus");

    res.json(issues);
});

// Issues assigned to the current user (must be before /:id)
router.get("/assigned-to-me",auth,async (req,res)=>{
    const issues=await Issue.find({ assignedTo: req.user.id, isResolved: false })
    .populate('assignedTo',"name email")
    .populate('createdBy',"name email")
    .populate("linkedExecutionId","testName overallStatus")
    .sort({ createdAt: -1 })
    .lean();
    res.json(issues);
});

// Only creator sees their resolved issues (must be before /:id)
router.get("/my-resolved",auth,async (req,res)=>{
    const issues=await Issue.find({
        createdBy:req.user.id,
        isResolved:true
    })
    .populate("resolvedBy","name email")
    .populate("linkedExecutionId","testName overallStatus")
    .sort({ resolvedAt: -1 })
    .lean();
    res.json(issues);
});

router.get("/:id",auth,async (req,res)=>{
    const issue=await Issue.findById(req.params.id)
    .populate("assignedTo","name email")
    .populate("createdBy","name email")
    .populate("linkedExecutionId")
    .populate("resolvedBy","name email");
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    const isCreator=issue.createdBy && issue.createdBy._id
        ? String(issue.createdBy._id)===String(req.user.id)
        : String(issue.createdBy)===String(req.user.id);
    const out=issue.toObject ? issue.toObject() : issue;
    if (!isCreator && out.resolutionInstructions) delete out.resolutionInstructions;
    res.json(out);
});

router.put("/:id",auth,allowRoles('admin','tester'),async (req,res)=>{
    const updates={ ...req.body };
    if (updates.isResolved===true || req.body.instructions!==undefined) {
        updates.isResolved=true;
        updates.resolvedBy=req.user.id;
        updates.resolutionInstructions=req.body.instructions ?? updates.resolutionInstructions ?? '';
        updates.resolvedAt=new Date();
    }
    const issue=await Issue.findByIdAndUpdate(req.params.id,updates,{ new: true })
        .populate('resolvedBy','name email');
    res.json(issue);
});

// Delete all issues (admin only). Must be before /:id so DELETE /issues matches here.
router.delete("/",auth,allowRoles('admin'),async (req,res)=>{
    const result=await Issue.deleteMany({});
    res.json({message:"All issues deleted", deletedCount:result.deletedCount});
});

router.delete("/:id",auth,allowRoles('admin'),async (req,res)=>{
    await Issue.findByIdAndDelete(req.params.id);
    res.json({message:"Issue deleted"});
});

module.exports=router;