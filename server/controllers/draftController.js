const { db } = require("../config/firebase");

const saveDraft = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.uid;
    const draftId = req.params.draftId;

    const draftData = {
      title: title || "Untitled",
      content,
      updatedAt: new Date().toISOString(),
      userId,
    };

    if (draftId) {
      await db.collection("drafts").doc(draftId).update(draftData);
    } else {
      draftData.createdAt = new Date().toISOString();
      await db.collection("drafts").add(draftData);
    }

    res.status(200).json({ success: true, draftId });
  } catch (error) {
    console.error("Error saving draft:", error);
    res.status(500).json({ error: error.message });
  }
};

const getUserDrafts = async (req, res) => {
  try {
    const userId = req.user.uid;
    console.log("Fetching drafts for user:", userId);

    // Check if db is available
    if (!db || !db.collection) {
      throw new Error("Firestore not properly initialized");
    }

    const draftsSnapshot = await db
      .collection("drafts")
      .where("userId", "==", userId)
      .orderBy("updatedAt", "desc")
      .get();

    if (draftsSnapshot.empty) {
      console.log("No drafts found for user:", userId);
      return res.json([]);
    }

    const drafts = [];
    draftsSnapshot.forEach((doc) => {
      drafts.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`Found ${drafts.length} drafts for user:`, userId);
    res.json(drafts);
  } catch (error) {
    console.error("Error fetching drafts:", error);
    res.status(500).json({
      error: "Failed to fetch drafts",
      details: error.message,
    });
  }
};

//get a specific draft
const getDraft = async (req, res) => {
  try {
    const draftId = req.params.draftId;
    const userId = req.user.uid;

    const draftDoc = await db.collection("drafts").doc(draftId).get();

    if (!draftDoc.exists) {
      return res.status(404).json({ error: "Draft not found" });
    }

    const draft = draftDoc.data();

    if (draft.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    res.status(200).json({
      id: draftDoc.id,
      ...draft,
    });
  } catch (error) {
    console.error("Error fetching draft:", error);
    res.status(500).json({ error: error.message });
  }
};

const deleteDraft = async (req, res) => {
  try {
    const draftId = req.params.draftId;
    const userId = req.user.uid;

    const draftDoc = await db.collection("drafts").doc(draftId).get();

    if (!draftDoc.exists) {
      return res.status(404).json({ error: "Draft not found" });
    }

    if (draftDoc.data().userId !== userId) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    await db.collection("drafts").doc(draftId).delete();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting draft:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  saveDraft,
  getUserDrafts,
  getDraft,
  deleteDraft,
};
