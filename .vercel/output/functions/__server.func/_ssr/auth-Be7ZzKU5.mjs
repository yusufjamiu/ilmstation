import { o as initializeApp } from "../_libs/@firebase/app+[...].mjs";
import { a as signInWithPopup, i as signInWithEmailAndPassword, n as createUserWithEmailAndPassword, o as updateProfile, r as getAuth, t as GoogleAuthProvider } from "../_libs/firebase__auth.mjs";
import "../_libs/firebase.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-Be7ZzKU5.js
var app = initializeApp({
	apiKey: "AIzaSyBGgKqjQR2gHgB2tx46DQ69RZIztXvHP9M",
	authDomain: "ilmstation-app.firebaseapp.com",
	projectId: "ilmstation-app",
	storageBucket: "ilmstation-app.firebasestorage.app",
	messagingSenderId: "986805337788",
	appId: "1:986805337788:web:862289d7760025f1c75ab9"
});
var auth = getAuth(app);
var googleProvider = new GoogleAuthProvider();
async function signUp(email, password, name) {
	const cred = await createUserWithEmailAndPassword(auth, email, password);
	if (name) await updateProfile(cred.user, { displayName: name });
	return cred.user;
}
async function logIn(email, password) {
	return (await signInWithEmailAndPassword(auth, email, password)).user;
}
async function logInWithGoogle() {
	return (await signInWithPopup(auth, googleProvider)).user;
}
/** Turns Firebase's error codes into plain-language messages for the UI. */
function authErrorMessage(err) {
	switch (err?.code ?? "") {
		case "auth/email-already-in-use": return "That email is already registered. Try logging in instead.";
		case "auth/invalid-email": return "That email address doesn't look right.";
		case "auth/weak-password": return "Password is too weak — use 8+ characters with a number and a capital letter.";
		case "auth/user-not-found":
		case "auth/wrong-password":
		case "auth/invalid-credential": return "Email or password is incorrect.";
		case "auth/too-many-requests": return "Too many attempts. Please wait a moment and try again.";
		default: return "Something went wrong. Please try again.";
	}
}
//#endregion
export { signUp as i, logIn as n, logInWithGoogle as r, authErrorMessage as t };
