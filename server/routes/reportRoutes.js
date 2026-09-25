import express from "express";

import {
  Timestamp,
} from "firebase-admin/firestore";

import {
  adminDb,
} from "../services/firebaseAdmin.js";

import {
  requireAuth,
} from "../middleware/authMiddleware.js";


const router = express.Router();


const REPORTS_COLLECTION =
  "reports";

const PUBLIC_REPORTS_COLLECTION =
  "publicReports";


// ============================================================
// HELPERS
// ============================================================

function toIsoDate(value) {
  if (!value) {
    return null;
  }

  if (
    value instanceof Timestamp
  ) {
    return value.toDate().toISOString();
  }

  if (
    value?.toDate &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }

  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }

  if (
    typeof value === "object" &&
    typeof value.seconds === "number"
  ) {
    return new Date(
      value.seconds * 1000
    ).toISOString();
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  return null;
}


// ============================================================
// NORMALIZE REPORT TYPE
// ============================================================

function normalizeReportType(
  reportType
) {
  if (
    reportType ===
    "report-something"
  ) {
    return "report-something";
  }

  if (
    reportType ===
    "report-now"
  ) {
    return "report-now";
  }

  if (
    reportType ===
    "observation"
  ) {
    return "report-something";
  }

  return "report-now";
}


// ============================================================
// SANITIZE PUBLIC REPORT
// ============================================================

function sanitizePublicReport(
  reportId,
  data
) {
  const location =
    data.location || {};

  const evidence =
    data.evidence || {};

  const aiAnalysis =
    data.aiAnalysis || {};


  return {
    id: reportId,

    reportId,


    // ------------------------------------------
    // BASIC INFORMATION
    // ------------------------------------------

    reportType:
      normalizeReportType(
        data.reportType
      ),

    category:
      data.category || "",

    description:
      data.description || "",


    // ------------------------------------------
    // OBSERVATION
    // ------------------------------------------

    observationDate:
      data.observationDate ||
      data.observation?.date ||
      "",

    observationTime:
      data.observationTime ||
      data.observation?.time ||
      "",

    observation:
      data.observation || null,


    // ------------------------------------------
    // LOCATION
    // ------------------------------------------

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
        typeof location.latitude ===
        "number"
          ? location.latitude
          : null,

      longitude:
        typeof location.longitude ===
        "number"
          ? location.longitude
          : null,

      accuracy:
        typeof location.accuracy ===
        "number"
          ? location.accuracy
          : null,

      approximateLocation:
        location.approximateLocation ||
        "",
    },


    // ------------------------------------------
    // EVIDENCE
    // ------------------------------------------

    evidence: {
      hasImage:
        evidence.hasImage ??
        Boolean(
          evidence.imageUrl
        ),

      imageUrl:
        evidence.imageUrl ||
        "",

      fileName:
        evidence.fileName ||
        "",

      fileType:
        evidence.fileType ||
        "",
    },


    // ------------------------------------------
    // AI ANALYSIS
    // ------------------------------------------

    aiAnalysis: {
      checked:
        aiAnalysis.checked ??
        false,

      detectedIssue:
        aiAnalysis.detectedIssue ||
        aiAnalysis.imageDetectedIssue ||
        "",

      suggestedCategory:
        aiAnalysis.suggestedCategory ||
        "",

      confidence:
        Number(
          aiAnalysis.confidence ??
          aiAnalysis.visualConfidence ??
          0
        ),

      observations:
        Array.isArray(
          aiAnalysis.observations
        )
          ? aiAnalysis.observations
          : [],

      categoryMatch:
        aiAnalysis.categoryMatch ??
        null,

      descriptionMatch:
        aiAnalysis.descriptionMatch ??
        null,

      consistencyScore:
        aiAnalysis.consistencyScore ??
        null,

      reason:
        aiAnalysis.reason ||
        "",

      result:
        aiAnalysis.result ||
        "",
    },


    // ------------------------------------------
    // STATUS
    // ------------------------------------------

    status:
      data.status ||
      "reported",


    // ------------------------------------------
    // CREATED DATE
    // ------------------------------------------

    createdAt:
      toIsoDate(
        data.createdAt
      ),

    updatedAt:
      toIsoDate(
        data.updatedAt
      ),
  };
}


// ============================================================
// WRITE PUBLIC REPORT
// ============================================================

async function writePublicReport(
  reportId,
  reportData
) {
  const publicReport =
    sanitizePublicReport(
      reportId,
      reportData
    );


  await adminDb
    .collection(
      PUBLIC_REPORTS_COLLECTION
    )
    .doc(reportId)
    .set(
      publicReport,
      {
        merge: true,
      }
    );


  return publicReport;
}


// ============================================================
// CREATE REPORT
// ============================================================

router.post(
  "/",
  requireAuth,
  async (req, res) => {
    try {
      const userId =
        req.user.uid;


      const body =
        req.body || {};


      // ------------------------------------------
      // VALIDATION
      // ------------------------------------------

      if (
        !body.category ||
        !body.category.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Complaint category is required.",
        });
      }


      if (
        !body.description ||
        !body.description.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Complaint description is required.",
        });
      }


      const reportType =
        normalizeReportType(
          body.reportType
        );


      // ------------------------------------------
      // LOCATION
      // ------------------------------------------

      const location =
        body.location || {};


      const reportData = {
        userId,


        reportType,


        category:
          body.category.trim(),


        description:
          body.description.trim(),


        observationDate:
          body.observationDate ||
          "",


        observationTime:
          body.observationTime ||
          "",


        observation:
          body.observation ||
          null,


        location: {
          state:
            location.state ||
            "",

          city:
            location.city ||
            "",

          district:
            location.district ||
            "",

          area:
            location.area ||
            "",

          latitude:
            typeof location.latitude ===
            "number"
              ? location.latitude
              : null,

          longitude:
            typeof location.longitude ===
            "number"
              ? location.longitude
              : null,

          accuracy:
            typeof location.accuracy ===
            "number"
              ? location.accuracy
              : null,

          approximateLocation:
            location.approximateLocation ||
            "",
        },


        // --------------------------------------
        // EVIDENCE
        // --------------------------------------

        evidence: {
          hasImage:
            body.evidence?.hasImage ??
            Boolean(
              body.evidence?.imageUrl
            ),

          imageUrl:
            body.evidence?.imageUrl ||
            "",

          fileName:
            body.evidence?.fileName ||
            "",

          fileType:
            body.evidence?.fileType ||
            "",
        },


        // --------------------------------------
        // AI
        // --------------------------------------

        aiAnalysis: {
          checked:
            body.aiAnalysis?.checked ??
            false,

          detectedIssue:
            body.aiAnalysis?.detectedIssue ||
            "",

          suggestedCategory:
            body.aiAnalysis?.suggestedCategory ||
            "",

          confidence:
            Number(
              body.aiAnalysis?.confidence ??
              0
            ),

          observations:
            Array.isArray(
              body.aiAnalysis?.observations
            )
              ? body.aiAnalysis.observations
              : [],

          categoryMatch:
            body.aiAnalysis?.categoryMatch ??
            null,

          descriptionMatch:
            body.aiAnalysis?.descriptionMatch ??
            null,

          consistencyScore:
            Number(
              body.aiAnalysis?.consistencyScore ??
              0
            ),

          reason:
            body.aiAnalysis?.reason ||
            "",

          result:
            body.aiAnalysis?.result ||
            "",
        },


        status:
          body.status ||
          "reported",


        createdAt:
          Timestamp.now(),

        updatedAt:
          Timestamp.now(),
      };


      // ------------------------------------------
      // SAVE PRIVATE REPORT
      // ------------------------------------------

      const reportRef =
        await adminDb
          .collection(
            REPORTS_COLLECTION
          )
          .add(
            reportData
          );


      // ------------------------------------------
      // SAVE PUBLIC COPY
      // ------------------------------------------

      const publicReport =
        await writePublicReport(
          reportRef.id,
          reportData
        );


      return res.status(201).json({
        success: true,

        message:
          "Complaint submitted successfully.",

        reportId:
          reportRef.id,

        report:
          publicReport,
      });

    } catch (error) {
      console.error(
        "Create report error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to create complaint.",
      });
    }
  }
);


// ============================================================
// GET MY REPORTS
// ============================================================

router.get(
  "/my",
  requireAuth,
  async (req, res) => {
    try {
      const userId =
        req.user.uid;


      const snapshot =
        await adminDb
          .collection(
            REPORTS_COLLECTION
          )
          .where(
            "userId",
            "==",
            userId
          )
          .get();


      const reports =
        snapshot.docs
          .map((doc) =>
            sanitizePublicReport(
              doc.id,
              doc.data()
            )
          )
          .sort(
            (a, b) => {
              const dateA =
                a.createdAt
                  ? new Date(
                      a.createdAt
                    ).getTime()
                  : 0;

              const dateB =
                b.createdAt
                  ? new Date(
                      b.createdAt
                    ).getTime()
                  : 0;

              return dateB - dateA;
            }
          );


      return res.status(200).json({
        success: true,
        reports,
      });

    } catch (error) {
      console.error(
        "Get my reports error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load your complaints.",
      });
    }
  }
);


// ============================================================
// GET PUBLIC REPORTS
// ============================================================

router.get(
  "/public",
  async (req, res) => {
    try {
      const {
        state,
        city,
        district,
        area,
        category,
        reportType,
      } = req.query;


      /*
       * IMPORTANT:
       *
       * Read directly from `reports`.
       *
       * This ensures BOTH:
       *
       * Report Now
       * Report Something I Saw
       *
       * are visible even if an older report
       * was created before publicReports
       * was implemented.
       */

      const snapshot =
        await adminDb
          .collection(
            REPORTS_COLLECTION
          )
          .get();


      let reports =
        snapshot.docs.map(
          (doc) =>
            sanitizePublicReport(
              doc.id,
              doc.data()
            )
        );


      // ------------------------------------------
      // FILTER STATE
      // ------------------------------------------

      if (state) {
        reports =
          reports.filter(
            (report) =>
              report.location.state
                .toLowerCase()
                .includes(
                  String(state)
                    .toLowerCase()
                )
          );
      }


      // ------------------------------------------
      // FILTER CITY
      // ------------------------------------------

      if (city) {
        reports =
          reports.filter(
            (report) =>
              report.location.city
                .toLowerCase()
                .includes(
                  String(city)
                    .toLowerCase()
                )
          );
      }


      // ------------------------------------------
      // FILTER DISTRICT
      // ------------------------------------------

      if (district) {
        reports =
          reports.filter(
            (report) =>
              report.location.district
                .toLowerCase()
                .includes(
                  String(district)
                    .toLowerCase()
                )
          );
      }


      // ------------------------------------------
      // FILTER AREA
      // ------------------------------------------

      if (area) {
        reports =
          reports.filter(
            (report) =>
              report.location.area
                .toLowerCase()
                .includes(
                  String(area)
                    .toLowerCase()
                )
          );
      }


      // ------------------------------------------
      // FILTER CATEGORY
      // ------------------------------------------

      if (category) {
        reports =
          reports.filter(
            (report) =>
              report.category
                .toLowerCase()
                .includes(
                  String(category)
                    .toLowerCase()
                )
          );
      }


      // ------------------------------------------
      // FILTER REPORT TYPE
      // ------------------------------------------

      if (reportType) {
        reports =
          reports.filter(
            (report) =>
              report.reportType ===
              reportType
          );
      }


      // ------------------------------------------
      // NEWEST FIRST
      // ------------------------------------------

      reports.sort(
        (a, b) => {
          const dateA =
            a.createdAt
              ? new Date(
                  a.createdAt
                ).getTime()
              : 0;

          const dateB =
            b.createdAt
              ? new Date(
                  b.createdAt
                ).getTime()
              : 0;

          return dateB - dateA;
        }
      );


      return res.status(200).json({
        success: true,

        count:
          reports.length,

        reports,
      });

    } catch (error) {
      console.error(
        "Get public reports error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load public complaints.",
      });
    }
  }
);


// ============================================================
// GET ONE PUBLIC REPORT
// ============================================================

router.get(
  "/public/:id",
  async (req, res) => {
    try {
      const reportId =
        req.params.id;


      if (!reportId) {
        return res.status(400).json({
          success: false,
          message:
            "Complaint ID is required.",
        });
      }


      // ------------------------------------------
      // FIRST: PRIVATE REPORTS COLLECTION
      // ------------------------------------------

      const reportDoc =
        await adminDb
          .collection(
            REPORTS_COLLECTION
          )
          .doc(reportId)
          .get();


      if (
        reportDoc.exists
      ) {
        const report =
          sanitizePublicReport(
            reportDoc.id,
            reportDoc.data()
          );


        return res.status(200).json({
          success: true,
          report,
        });
      }


      // ------------------------------------------
      // FALLBACK: PUBLIC REPORTS
      // ------------------------------------------

      const publicDoc =
        await adminDb
          .collection(
            PUBLIC_REPORTS_COLLECTION
          )
          .doc(reportId)
          .get();


      if (
        publicDoc.exists
      ) {
        const report =
          sanitizePublicReport(
            publicDoc.id,
            publicDoc.data()
          );


        return res.status(200).json({
          success: true,
          report,
        });
      }


      return res.status(404).json({
        success: false,

        message:
          "Complaint not found.",
      });

    } catch (error) {
      console.error(
        "Get public report error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load complaint.",
      });
    }
  }
);


// ============================================================
// DELETE MY REPORT
// ============================================================

router.delete(
  "/:id",
  requireAuth,
  async (req, res) => {
    try {
      const reportId =
        req.params.id;

      const userId =
        req.user.uid;


      if (!reportId) {
        return res.status(400).json({
          success: false,

          message:
            "Complaint ID is required.",
        });
      }


      const reportRef =
        adminDb
          .collection(
            REPORTS_COLLECTION
          )
          .doc(reportId);


      const reportDoc =
        await reportRef.get();


      if (
        !reportDoc.exists
      ) {
        return res.status(404).json({
          success: false,

          message:
            "Complaint not found.",
        });
      }


      const reportData =
        reportDoc.data();


      // ------------------------------------------
      // OWNERSHIP CHECK
      // ------------------------------------------

      if (
        reportData.userId !==
        userId
      ) {
        return res.status(403).json({
          success: false,

          message:
            "You are not allowed to delete this complaint.",
        });
      }


      // ------------------------------------------
      // DELETE PRIVATE REPORT
      // ------------------------------------------

      await reportRef.delete();


      // ------------------------------------------
      // DELETE PUBLIC COPY
      // ------------------------------------------

      await adminDb
        .collection(
          PUBLIC_REPORTS_COLLECTION
        )
        .doc(reportId)
        .delete()
        .catch(() => {});


      return res.status(200).json({
        success: true,

        message:
          "Complaint deleted successfully.",
      });

    } catch (error) {
      console.error(
        "Delete report error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to delete complaint.",
      });
    }
  }
);


export default router;