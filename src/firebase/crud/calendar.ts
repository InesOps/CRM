import {
  collection, doc,
  getDocs, addDoc, updateDoc, deleteDoc,
  Timestamp, query, orderBy
} from "firebase/firestore";
import { db } from "../config";

export const getCalendarEvents = () =>
  getDocs(query(collection(db, "calendar"), orderBy("date")));

export const addCalendarEvent = (data: {
  title:        string;
  date:         string;
  startTime:    string;
  endTime:      string;
  type:         string;
  location:     string;
  participants: string;
  notes:        string;
}) =>
  addDoc(collection(db, "calendar"), {
    ...data,
    createdAt: Timestamp.now(),
  });

export const updateCalendarEvent = (id: string, data: object) =>
  updateDoc(doc(db, "calendar", id), {
    ...data,
    updatedAt: Timestamp.now(),
  });

export const deleteCalendarEvent = (id: string) =>
  deleteDoc(doc(db, "calendar", id));