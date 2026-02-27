import { generateJoinCode } from "../utils/joinCode.js";

export async function createSession(req, res, next) {
  // TODO: create session with join code, link to quiz
}

export async function getSession(req, res, next) {
  // TODO: return session details with participants and state
}

export async function joinSession(req, res, next) {
  // TODO: find session by join code, add participant
}

export async function startSession(req, res, next) {
  // TODO: set session status to LIVE, create session state
}

export async function endSession(req, res, next) {
  // TODO: set session status to COMPLETED, calculate final scores
}
