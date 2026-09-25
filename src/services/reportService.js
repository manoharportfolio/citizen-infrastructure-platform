import { auth } from "../firebase/config";


const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";


// ============================================================
// CREATE REPORT
// ============================================================

export async function createReport(
  reportData
) {
  const user =
    auth.currentUser;


  if (!user) {
    throw new Error(
      "You must be logged in to submit a complaint."
    );
  }


  if (!reportData) {
    throw new Error(
      "Complaint data is required."
    );
  }


  const token =
    await user.getIdToken();


  const response =
    await fetch(
      `${API_URL}/api/reports`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        body:
          JSON.stringify(
            reportData
          ),
      }
    );


  let data;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "The server returned an invalid response."
    );
  }


  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to submit complaint."
    );
  }


  return data;
}


// ============================================================
// GET MY REPORTS
// ============================================================

export async function getMyReports() {
  const user =
    auth.currentUser;


  if (!user) {
    throw new Error(
      "You must be logged in to view your complaints."
    );
  }


  const token =
    await user.getIdToken();


  const response =
    await fetch(
      `${API_URL}/api/reports/my`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


  let data;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "The server returned an invalid response."
    );
  }


  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to load your complaints."
    );
  }


  return data;
}


// ============================================================
// DELETE REPORT
// ============================================================

export async function deleteReport(
  reportId
) {
  const user =
    auth.currentUser;


  if (!user) {
    throw new Error(
      "You must be logged in to delete a complaint."
    );
  }


  if (!reportId) {
    throw new Error(
      "Complaint ID is required."
    );
  }


  const token =
    await user.getIdToken();


  const response =
    await fetch(
      `${API_URL}/api/reports/${encodeURIComponent(
        reportId
      )}`,
      {
        method: "DELETE",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


  let data;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "The server returned an invalid response."
    );
  }


  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to delete complaint."
    );
  }


  return data;
}