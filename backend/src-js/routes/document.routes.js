const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  markNoticeAsRead,
} = require('../controllers/document.controller');

const router = Router({ mergeParams: true });

router.use(authenticate);

// Document management
router.get('/', getDocuments);
router.post('/', createDocument);
router.put('/:documentId', updateDocument);
router.delete('/:documentId', deleteDocument);

// Notice management (under same property scope)
router.get('/notices', getNotices);
router.post('/notices', createNotice);
router.put('/notices/:noticeId', updateNotice);
router.delete('/notices/:noticeId', deleteNotice);
router.post('/notices/:noticeId/read', markNoticeAsRead);

module.exports = router;
