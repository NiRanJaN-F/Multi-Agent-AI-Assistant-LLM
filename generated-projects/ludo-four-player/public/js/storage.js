/**
 * storage.js — LocalStorage Persistence & Data Management Engine
 * SecureVote Decentralized Online Voting System
 */

import { INITIAL_CANDIDATES } from './candidates.js';

const STORAGE_KEYS = {
  CANDIDATES: 'securevote_candidates_v1',
  VOTES: 'securevote_votes_v1',
  HAS_VOTED: 'securevote_has_voted_v1',
  VOTER_INFO: 'securevote_voter_info_v1',
  AUDIT_LOGS: 'securevote_audit_logs_v1'
};

export const Storage = {
  /**
   * Initializes storage with default datasets if empty
   */
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.CANDIDATES)) {
      this.saveCandidates(INITIAL_CANDIDATES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.VOTES)) {
      localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify({}));
    }
    if (!localStorage.getItem(STORAGE_KEYS.HAS_VOTED)) {
      localStorage.setItem(STORAGE_KEYS.HAS_VOTED, JSON.stringify(false));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      const initialLogs = [
        {
          id: 'log-0',
          action: 'SYSTEM_INIT',
          details: 'SecureVote cryptographically secure ballot ledger initialized.',
          timestamp: new Date().toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialLogs));
    }
  },

  /**
   * Retrieve all candidates
   * @returns {Array} List of candidate objects
   */
  getCandidates() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CANDIDATES);
      return data ? JSON.parse(data) : INITIAL_CANDIDATES;
    } catch (e) {
      console.error('Failed to parse candidates from storage:', e);
      return INITIAL_CANDIDATES;
    }
  },

  /**
   * Save candidates array to storage
   * @param {Array} candidates 
   */
  saveCandidates(candidates) {
    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(candidates));
  },

  /**
   * Get vote counts object mapping candidateId -> count
   * @returns {Object}
   */
  getVotes() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VOTES);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Failed to parse votes from storage:', e);
      return {};
    }
  },

  /**
   * Cast a vote for a candidate
   * @param {string|number} candidateId 
   * @param {Object} voterMeta 
   * @returns {boolean} Success status
   */
  castVote(candidateId, voterMeta = {}) {
    if (this.hasUserVoted()) {
      throw new Error('User has already cast a ballot in this session.');
    }

    const votes = this.getVotes();
    votes[candidateId] = (votes[candidateId] || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify(votes));

    // Mark as voted
    localStorage.setItem(STORAGE_KEYS.HAS_VOTED, JSON.stringify(true));
    localStorage.setItem(STORAGE_KEYS.VOTER_INFO, JSON.stringify({
      candidateId,
      timestamp: new Date().toISOString(),
      ...voterMeta
    }));

    // Add audit log
    this.addAuditLog('BALLOT_CAST', `Encrypted vote successfully registered for candidate ID: ${candidateId}`);

    return true;
  },

  /**
   * Check if current browser session/user has voted
   * @returns {boolean}
   */
  hasUserVoted() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HAS_VOTED);
      return data ? JSON.parse(data) : false;
    } catch (e) {
      return false;
    }
  },

  /**
   * Get stored voter info receipt
   * @returns {Object|null}
   */
  getVoterInfo() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VOTER_INFO);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Get total number of votes cast across all candidates
   * @returns {number}
   */
  getTotalVotesCount() {
    const votes = this.getVotes();
    return Object.values(votes).reduce((acc, count) => acc + count, 0);
  },

  /**
   * Add new candidate (Admin action)
   * @param {Object} candidateData 
   */
  addCandidate(candidateData) {
    const candidates = this.getCandidates();
    const newCandidate = {
      id: candidateData.id || `candidate_${Date.now()}`,
      name: candidateData.name || 'Unnamed Candidate',
      party: candidateData.party || 'Independent',
      manifesto: candidateData.manifesto || 'No manifesto provided.',
      avatar: candidateData.avatar || 'assets/default-avatar.png',
      ...candidateData
    };
    candidates.push(newCandidate);
    this.saveCandidates(candidates);
    this.addAuditLog('CANDIDATE_ADDED', `New candidate added: ${newCandidate.name} (${newCandidate.party})`);
    return newCandidate;
  },

  /**
   * Get audit logs
   * @returns {Array}
   */
  getAuditLogs() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse audit logs from storage:', e);
      return [];
    }
  },

  /**
   * Add an audit log entry
   * @param {string} action 
   * @param {string} details 
   */
  addAuditLog(action, details) {
    const logs = this.getAuditLogs();
    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    return newLog;
  },

  /**
   * Reset all voting data (Admin/Test action)
   */
  resetSystem() {
    localStorage.removeItem(STORAGE_KEYS.VOTES);
    localStorage.removeItem(STORAGE_KEYS.HAS_VOTED);
    localStorage.removeItem(STORAGE_KEYS.VOTER_INFO);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    this.saveCandidates(INITIAL_CANDIDATES);
    this.init();
  }
};