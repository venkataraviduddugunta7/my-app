import { Router } from 'express';
import { DocumentController, upload } from '../controllers/document.controller';
import { authenticate, requirePropertyOwnership } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

// All routes require authentication and property ownership
router.use(authenticate);
router.use('/', requirePropertyOwnership);

// Document management
router.post('/', upload.single('file'), DocumentController.createDocument);
router.get('/', DocumentController.getDocuments);
router.get('/:documentId/download', DocumentController.downloadDocument);
router.put('/:documentId', DocumentController.updateDocument);
router.delete('/:documentId', DocumentController.deleteDocument);

// Notice management
router.post('/notices', DocumentController.createNotice);
router.get('/notices', DocumentController.getNotices);
router.put('/notices/:noticeId', DocumentController.updateNotice);
router.delete('/notices/:noticeId', DocumentController.deleteNotice);
router.post('/notices/:noticeId/read', DocumentController.markNoticeAsRead);

export default router;
