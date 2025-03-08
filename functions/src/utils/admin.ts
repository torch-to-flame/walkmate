import { remoteConfig } from "firebase-admin";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

var serviceAccount = require("../../walkmate-d42b4-firebase-adminsdk-fbsvc-909bb7fa19.json");

export const appEnv =
  process.env.NODE_ENV === "production" ? "production" : "development";
export const projectId = serviceAccount.project_id;

const admin = initializeApp({
  projectId: serviceAccount.project_id,
  credential: cert(serviceAccount),
});

export const db = getFirestore();
export const auth = getAuth();
export const storage = getStorage();
export const config = remoteConfig();

export default admin;
