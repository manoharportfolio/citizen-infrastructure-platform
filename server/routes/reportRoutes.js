import express from "express";
import { adminDb } from "../services/firebaseAdmin.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================================================
   CREATE REPORT
========================================================= */

router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      reportType,
      category,
      description,
      observationDate,
      observationTime,
      location,
      evidence,
      aiAnalysis
    } = req.body;

    if (
      !reportType ||
      !category ||
      !description ||
      !location
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Required complaint information is missing."
      });
    }

    const privateReport = {
      userId: req.user.uid,

      reportType,
      category,
      description,

      observationDate:
        observationDate || null,

      observationTime:
        observationTime || null,

      location,

      evidence:
        evidence || null,

      aiAnalysis:
        aiAnalysis || {
          checked: false,
          result: "pending"
        },

      status: "reported",

      createdAt: new Date()
    };

    const reportReference =
      await adminDb
        .collection("reports")
        .add(privateReport);

    /*
     * Public version.
     *
     * IMPORTANT:
     * We deliberately do not expose userId.
     */
    const publicReport = {
      reportId: reportReference.id,

      reportType,

      category,

      description,

      location: {
        state:
          location.state || "",

        city:
          location.city || "",

        district:
          location.district || "",

        area:
          location.area || "",

        latitude:
          location.latitude ?? null,

        longitude:
          location.longitude ?? null,

        accuracy:
          location.accuracy ?? null
      },

      /*
       * Only safe evidence information is
       * exposed publicly.
       */
      evidence: evidence
        ? {
            hasImage:
              evidence.hasImage || false,

            imageUrl:
              evidence.imageUrl || "",

            fileName:
              evidence.fileName || "",

            fileType:
              evidence.fileType || ""
          }
        : null,

      aiAnalysis: {
        checked:
          aiAnalysis?.checked || false,

        detectedIssue:
          aiAnalysis?.detectedIssue || "",

        suggestedCategory:
          aiAnalysis?.suggestedCategory || "",

        confidence:
          aiAnalysis?.confidence ?? 0,

        observations:
          aiAnalysis?.observations || []
      },

      status: "reported",

      createdAt: new Date()
    };

    await adminDb
      .collection("publicReports")
      .doc(reportReference.id)
      .set(publicReport);

    return res.status(201).json({
      success: true,

      message:
        "Complaint submitted successfully.",

      reportId:
        reportReference.id
    });
  } catch (error) {
    console.error(
      "Create complaint error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to submit complaint."
    });
  }
});


/* =========================================================
   GET MY REPORTS
========================================================= */

router.get(
  "/my",
  requireAuth,
  async (req, res) => {
    try {
      const snapshot =
        await adminDb
          .collection("reports")
          .where(
            "userId",
            "==",
            req.user.uid
          )
          .get();

      const reports =
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

      reports.sort((a, b) => {
        const aTime =
          a.createdAt
            ?.toDate?.()
            ?.getTime() || 0;

        const bTime =
          b.createdAt
            ?.toDate?.()
            ?.getTime() || 0;

        return bTime - aTime;
      });

      return res.status(200).json({
        success: true,
        reports
      });
    } catch (error) {
      console.error(
        "Get my complaints error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load your complaints."
      });
    }
  }
);


/* =========================================================
   DELETE MY REPORT
========================================================= */

router.delete(
  "/:id",
  requireAuth,
  async (req, res) => {
    try {
      const reportId =
        req.params.id;

      if (!reportId) {
        return res.status(400).json({
          success: false,
          message:
            "Report ID is required."
        });
      }

      /*
       * Get the private report first.
       */
      const reportReference =
        adminDb
          .collection("reports")
          .doc(reportId);

      const reportSnapshot =
        await reportReference.get();

      if (!reportSnapshot.exists) {
        return res.status(404).json({
          success: false,
          message:
            "Complaint not found."
        });
      }

      const report =
        reportSnapshot.data();

      /*
       * SECURITY CHECK:
       *
       * A citizen can delete ONLY
       * their own complaint.
       */
      if (
        report.userId !==
        req.user.uid
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only delete your own complaints."
        });
      }

      /*
       * Delete the private report.
       */
      await reportReference.delete();

      /*
       * Delete the corresponding
       * public report as well.
       */
      await adminDb
        .collection("publicReports")
        .doc(reportId)
        .delete();

      return res.status(200).json({
        success: true,
        message:
          "Complaint deleted successfully."
      });
    } catch (error) {
      console.error(
        "Delete complaint error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete complaint."
      });
    }
  }
);


/* =========================================================
   GET PUBLIC REPORTS
========================================================= */

router.get(
  "/public",
  async (req, res) => {
    try {
      const snapshot =
        await adminDb
          .collection("publicReports")
          .get();

      let reports =
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

      const {
        state,
        city,
        district,
        area,
        category
      } = req.query;

      if (state) {
        reports =
          reports.filter(
            (report) =>
              report.location?.state
                ?.toLowerCase() ===
              state.toLowerCase()
          );
      }

      if (city) {
        reports =
          reports.filter(
            (report) =>
              report.location?.city
                ?.toLowerCase() ===
              city.toLowerCase()
          );
      }

      if (district) {
        reports =
          reports.filter(
            (report) =>
              report.location?.district
                ?.toLowerCase() ===
              district.toLowerCase()
          );
      }

      if (area) {
        reports =
          reports.filter(
            (report) =>
              report.location?.area
                ?.toLowerCase() ===
              area.toLowerCase()
          );
      }

      if (category) {
        reports =
          reports.filter(
            (report) =>
              report.category
                ?.toLowerCase() ===
              category.toLowerCase()
          );
      }

      reports.sort((a, b) => {
        const aTime =
          a.createdAt
            ?.toDate?.()
            ?.getTime() ||
          new Date(
            a.createdAt || 0
          ).getTime();

        const bTime =
          b.createdAt
            ?.toDate?.()
            ?.getTime() ||
          new Date(
            b.createdAt || 0
          ).getTime();

        return bTime - aTime;
      });

      return res.status(200).json({
        success: true,
        count: reports.length,
        reports
      });
    } catch (error) {
      console.error(
        "Get public complaints error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load public complaints."
      });
    }
  }
);


/* =========================================================
   GET SINGLE PUBLIC REPORT
========================================================= */

router.get(
  "/public/:id",
  async (req, res) => {
    try {
      const reportId = req.params.id;

      /*
       * First try the document ID.
       */
      const documentReference =
        adminDb
          .collection("publicReports")
          .doc(reportId);

      const document =
        await documentReference.get();

      if (document.exists) {
        return res.status(200).json({
          success: true,
          report: {
            id: document.id,
            ...document.data()
          }
        });
      }

      /*
       * Some older public reports may have a
       * different document ID while their
       * reportId field contains the actual
       * complaint ID.
       */
      const matchingReports =
        await adminDb
          .collection("publicReports")
          .where(
            "reportId",
            "==",
            reportId
          )
          .limit(1)
          .get();

      if (!matchingReports.empty) {
        const matchingDocument =
          matchingReports.docs[0];

        return res.status(200).json({
          success: true,
          report: {
            id: matchingDocument.id,
            ...matchingDocument.data()
          }
        });
      }

      /*
       * If there is no public document,
       * check the private report.
       *
       * This also helps older complaints that
       * were created before publicReports was
       * populated correctly.
       */
      const privateReference =
        adminDb
          .collection("reports")
          .doc(reportId);

      const privateDocument =
        await privateReference.get();

      if (privateDocument.exists) {
        const privateReport =
          privateDocument.data();

        /*
         * Never expose userId publicly.
         */
        const publicReport = {
          reportId: reportId,

          reportType:
            privateReport.reportType ||
            "",

          category:
            privateReport.category ||
            "",

          description:
            privateReport.description ||
            "",

          observationDate:
            privateReport.observationDate ||
            null,

          observationTime:
            privateReport.observationTime ||
            null,

          location: {
            state:
              privateReport.location
                ?.state || "",

            city:
              privateReport.location
                ?.city || "",

            district:
              privateReport.location
                ?.district || "",

            area:
              privateReport.location
                ?.area || "",

            latitude:
              privateReport.location
                ?.latitude ?? null,

            longitude:
              privateReport.location
                ?.longitude ?? null,

            accuracy:
              privateReport.location
                ?.accuracy ?? null
          },

          evidence:
            privateReport.evidence
              ? {
                  hasImage:
                    privateReport.evidence
                      .hasImage || false,

                  imageUrl:
                    privateReport.evidence
                      .imageUrl || "",

                  fileName:
                    privateReport.evidence
                      .fileName || "",

                  fileType:
                    privateReport.evidence
                      .fileType || ""
                }
              : null,

          aiAnalysis: {
            checked:
              privateReport.aiAnalysis
                ?.checked || false,

            detectedIssue:
              privateReport.aiAnalysis
                ?.detectedIssue || "",

            suggestedCategory:
              privateReport.aiAnalysis
                ?.suggestedCategory || "",

            confidence:
              privateReport.aiAnalysis
                ?.confidence ?? 0,

            observations:
              privateReport.aiAnalysis
                ?.observations || []
          },

          status:
            privateReport.status ||
            "reported",

          createdAt:
            privateReport.createdAt ||
            null
        };

        /*
         * Repair the missing public document
         * so future requests work normally.
         */
        await adminDb
          .collection("publicReports")
          .doc(reportId)
          .set(publicReport);

        return res.status(200).json({
          success: true,
          report: {
            id: reportId,
            ...publicReport
          }
        });
      }

      return res.status(404).json({
        success: false,
        message:
          "Complaint not found."
      });
    } catch (error) {
      console.error(
        "Get complaint error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load complaint."
      });
    }
  }
);

export default router;