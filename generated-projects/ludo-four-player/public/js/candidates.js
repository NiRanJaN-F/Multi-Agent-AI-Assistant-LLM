/**
 * candidates.js - Candidate Database, Default Seed Data & Management Logic
 * SecureVote Online Voting System
 * 
 * Manages the default candidate roster, candidate CRUD operations, search/filter logic,
 * and state synchronization with storage.js.
 */

import { storage } from './storage.js';

export const candidates = {
  // Default candidates list with rich metadata, manifestos, tags, and Unsplash avatars
  defaultCandidates: [
    {
      id: 'cand-1',
      name: 'Dr. Elena Vance',
      party: 'Progressive Tech Alliance',
      category: 'technology',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600',
      manifesto: 'Championing open-source government infrastructure, robust AI regulation, and universal high-speed fiber internet access for every citizen.',
      stats: {
        experience: '12 Yrs Public Service',
        focus: 'Digital Sovereignty',
        rating: '4.9/5.0'
      },
      votes: 1420
    },
    {
      id: 'cand-2',
      name: 'Marcus Sterling',
      party: 'Economic Renaissance Party',
      category: 'economy',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600',
      manifesto: 'Fostering small business innovation through tax simplification, cutting bureaucratic red tape, and expanding green venture capital funds.',
      stats: {
        experience: '15 Yrs FinTech Leadership',
        focus: 'SME Growth & Jobs',
        rating: '4.8/5.0'
      },
      votes: 1285
    },
    {
      id: 'cand-3',
      name: 'Aisha Morales',
      party: 'Green Horizon Coalition',
      category: 'environment',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=600',
      manifesto: 'Transitioning the national grid to 100% renewable energy by 2030, investing in public mass transit, and protecting our national wildlife preserves.',
      stats: {
        experience: '10 Yrs Environmental Law',
        focus: 'Climate Action',
        rating: '4.9/5.0'
      },
      votes: 1650
    },
    {
      id: 'cand-4',
      name: 'Julian Thorne',
      party: 'Healthcare For All Front',
      category: 'healthcare',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=600',
      manifesto: 'Modernizing national healthcare delivery with AI-assisted diagnostics, capping pharmaceutical prices, and guaranteeing mental health coverage.',
      stats: {
        experience: '20 Yrs Chief Surgeon',
        focus: 'Universal Care',
        rating: '4.7/5.0'
      },
      votes: 980
    },
    {
      id: 'cand-5',
      name: 'Sophia Chen',
      party: 'Future Minds Education Initiative',
      category: 'education',
      avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=600',
      manifesto: 'Reforming curriculum standards to emphasize critical thinking, coding literacy, financial wellness, and eliminating student loan burdens.',
      stats: {
        experience: '14 Yrs University Dean',
        focus: 'EduTech Reform',
        rating: '4.9/5.0'
      },
      votes: 1120
    },
    {
      id: 'cand-6',
      name: 'David O\'Connor',
      party: 'Civic Liberty & Security Party',
      category: 'technology',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
      manifesto: 'Safeguarding digital privacy rights, decentralizing state cybersecurity networks, and ensuring absolute transparency in government spending.',
      stats: {
        experience: '18 Yrs Cybersecurity Expert',
        focus: 'Data Privacy',
        rating: '4.6/5.0'
      },
      votes: 890
    }
  ],

  /**
   * Initialize candidate store in localStorage if empty
   */
  init() {
    const existing = storage.getCandidates();
    if (!existing || existing.length === 0) {
      storage.saveCandidates(this.defaultCandidates);
    }
  },

  /**
   * Get all candidates from storage
   */
  getAll() {
    const stored = storage.getCandidates();
    return stored && stored.length > 0 ? stored : this.defaultCandidates;
  },

  /**
   * Get a single candidate by ID
   */
  getById(id) {
    const list = this.getAll();
    return list.find(c => c.id === id) || null;
  },

  /**
   * Add a new candidate
   */
  add(candidateData) {
    const list = this.getAll();
    const newCandidate = {
      id: 'cand-' + Date.now(),
      name: candidateData.name || 'Independent Candidate',
      party: candidateData.party || 'Independent',
      category: candidateData.category || 'general',
      avatar: candidateData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
      manifesto: candidateData.manifesto || 'Dedicated to serving the public interest with integrity, transparency, and progressive reforms.',
      stats: candidateData.stats || {
        experience: 'Public Service',
        focus: 'Community Development',
        rating: '4.5/5.0'
      },
      votes: candidateData.votes || 0
    };
    list.push(newCandidate);
    storage.saveCandidates(list);
    return newCandidate;
  },

  /**
   * Cast a vote for a candidate
   */
  vote(id) {
    const list = this.getAll();
    const candidate = list.find(c => c.id === id);
    if (candidate) {
      candidate.votes = (candidate.votes || 0) + 1;
      storage.saveCandidates(list);
      return true;
    }
    return false;
  }
};