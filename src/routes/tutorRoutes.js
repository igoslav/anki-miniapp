const { Router } = require('express');
const { requireRole } = require('../middleware/roleCheck');
const {
  getStudents, generateInvite, removeStudent,
  createLesson, addCardsToLesson, getLessons, sendLesson,
  getInvitations, respondToInvitation, getStudentLessons, acceptLesson
} = require('../controllers/tutorController');

const router = Router({ mergeParams: true });

// Tutor-only routes
router.get('/tutor/students', requireRole('tutor'), getStudents);
router.post('/tutor/invite', requireRole('tutor'), generateInvite);
router.delete('/tutor/student/:linkId', requireRole('tutor'), removeStudent);
router.post('/tutor/lesson', requireRole('tutor'), createLesson);
router.post('/tutor/lesson/:lessonId/cards', requireRole('tutor'), addCardsToLesson);
router.get('/tutor/lessons', requireRole('tutor'), getLessons);
router.post('/tutor/lesson/:lessonId/send', requireRole('tutor'), sendLesson);

// Student routes (any authenticated user)
router.get('/student/invitations', getInvitations);
router.put('/student/invitation/:linkId', respondToInvitation);
router.get('/student/lessons', getStudentLessons);
router.post('/student/lesson/:lessonId/accept', acceptLesson);

module.exports = router;
