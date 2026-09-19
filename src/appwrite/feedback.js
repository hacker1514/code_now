import { Client, Databases, ID, Query } from "appwrite";
const client = new Client();
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

if (endpoint) {
	client.setEndpoint(endpoint);
}
if (projectId) {
	client.setProject(projectId);
}
const databases = new Databases(client);

export const submitFeedback = async (feedback, deviceId) => {
	const response = await databases.createDocument(
		import.meta.env.VITE_APPWRITE_FEEDBACK_DATABASE_ID,
		import.meta.env.VITE_APPWRITE_FEEDBACK_COLLECTION_ID,
		ID.unique(),
		{
			feedback: feedback,
			deviceId: deviceId,
		}
	);
	return response;
};
export const submitFeatureRequest = async (message, deviceId) => {
	const response = await databases.createDocument(
		import.meta.env.VITE_APPWRITE_FEEDBACK_DATABASE_ID,
		import.meta.env.VITE_APPWRITE_FEATURES_REQUEST_COLLECTION_ID,
		ID.unique(),
		{
			message: message,
			deviceId: deviceId,
		}
	);
	return response;
};
export const getFeatureList = async () => {
	const response = await databases.listDocuments(
		import.meta.env.VITE_APPWRITE_FEEDBACK_DATABASE_ID,
		import.meta.env.VITE_APPWRITE_UPCOMING_FEATURES_COLLECTION_ID,
		[Query.limit(100), Query.orderAsc("isCompleted")]
	);
	return response;
};
