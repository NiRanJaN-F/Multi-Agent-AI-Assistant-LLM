const express = require('express');
   const router = express.Router();
   const auth = require('../middleware/auth');
   const Card = require('../models/Card');
   const Board = require('../models/Board');

   // Valid columns for the kanban board
   const VALID_COLUMNS = ['To Do', 'In Progress', 'Done', 'Review'];