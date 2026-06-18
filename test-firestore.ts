import { initializeApp, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

try {
    const app = initializeApp({ projectId: "academic-stock-k07pf" });
    const db = getFirestore(app, "ai-studio-97e0cced-c6c0-42db-b126-28c6df581704");
    
    db.collection("test").add({ msg: "hello" }).then(() => console.log("OK")).catch(e => {
        console.error("ADD ERROR:", e.message);
    });
} catch (e) {
    console.error("INIT ERROR:", e.message);
}
