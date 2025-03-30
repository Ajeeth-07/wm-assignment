const { db } = require("../config/firebase");

// Update the saveDraft function to ensure it returns the draft ID
const saveDraft = async (req, res) => {
  try {
    const userId = req.user.uid;
    const draft = req.body;
    const draftId = req.params.draftId;

    if (!draft.title || !draft.content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    draft.userId = userId; // Ensure userId is set
    draft.updatedAt = new Date().toISOString();

    let docId;

    if (draftId) {
      // Update existing draft
      const draftRef = db.collection("drafts").doc(draftId);
      const doc = await draftRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: "Draft not found" });
      }

      if (doc.data().userId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      await draftRef.update(draft);
      docId = draftId;
    } else {
      // Create new draft
      draft.createdAt = new Date().toISOString();
      const docRef = await db.collection("drafts").add(draft);
      docId = docRef.id;
    }

    // Return the draft ID in the response
    res.status(200).json({
      success: true,
      id: docId,
      message: draftId
        ? "Draft updated successfully"
        : "Draft created successfully",
    });
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
