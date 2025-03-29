const express = require("express");
const router = express.Router();
const {saveDraft, getUserDrafts, getDraft, deleteDraft} = require("../controllers/draftController");
const {verifyToken} = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get('/', getUserDrafts);

router.get('/:draftId', getDraft);

router.post('/', saveDraft);

router.put('/:draftId', saveDraft);

router.delete('/:draftId', deleteDraft);

module.exports = router;