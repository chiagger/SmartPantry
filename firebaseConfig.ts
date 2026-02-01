import { getAnalytics } from "@react-native-firebase/analytics";
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { getFunctions } from '@react-native-firebase/functions';
import { getRemoteConfig } from "@react-native-firebase/remote-config";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Get modules of react-native-firebase
const db = getFirestore();
const auth = getAuth();
const functions = getFunctions(undefined, 'europe-west8');
const analytics = getAnalytics();
const remoteConfig = getRemoteConfig();

export { analytics, auth, db, functions, remoteConfig };
