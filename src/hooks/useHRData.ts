import { useState, useEffect } from "react";
import {
  Company,
  UserProfile,
  Invitation,
  Training,
  TimeRecord,
  Post,
  Goal
} from "../types";
import { dataService } from "../services/dataService";
import { INITIAL_GOALS } from "../utils/constants";

export function useHRData() {
  const [companies, setCompanies] = useState<Company[]>(() => dataService.getCompanies());
  const [users, setUsers] = useState<UserProfile[]>(() => dataService.getUsers());
  const [invitations, setInvitations] = useState<Invitation[]>(() => dataService.getInvitations());
  const [trainings, setTrainings] = useState<Training[]>(() => dataService.getTrainings());
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>(() => dataService.getTimeRecords());
  const [posts, setPosts] = useState<Post[]>(() => dataService.getPosts());
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);

  useEffect(() => {
    dataService.saveCompanies(companies);
  }, [companies]);

  useEffect(() => {
    dataService.saveUsers(users);
  }, [users]);

  useEffect(() => {
    dataService.saveInvitations(invitations);
  }, [invitations]);

  useEffect(() => {
    dataService.saveTrainings(trainings);
  }, [trainings]);

  useEffect(() => {
    dataService.saveTimeRecords(timeRecords);
  }, [timeRecords]);

  useEffect(() => {
    dataService.savePosts(posts);
  }, [posts]);

  // CRUD helpers
  const addUser = (newUser: UserProfile) => {
    setUsers((prev) => [newUser, ...prev]);
  };

  const updateUser = (updatedUser: UserProfile) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const addCompany = (newCompany: Company) => {
    setCompanies((prev) => [...prev, newCompany]);
  };

  const addPost = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const updatePost = (updatedPost: Post) => {
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  };

  const deletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const addRecord = (newRecord: TimeRecord) => {
    setTimeRecords((prev) => [newRecord, ...prev]);
  };

  const addInvitation = (newInvitation: Invitation) => {
    setInvitations((prev) => [newInvitation, ...prev]);
  };

  return {
    companies,
    setCompanies,
    users,
    setUsers,
    invitations,
    setInvitations,
    trainings,
    setTrainings,
    timeRecords,
    setTimeRecords,
    posts,
    setPosts,
    goals,
    setGoals,
    addUser,
    updateUser,
    deleteUser,
    addCompany,
    addPost,
    updatePost,
    deletePost,
    addRecord,
    addInvitation
  };
}
