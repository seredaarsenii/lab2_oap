import { Router } from 'express';
import { reportController } from '../controllers/report.controller.js';
import { validateReport } from '../middlewares/validate-report.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', reportController.getAll);

router.get('/stats', reportController.getStats);

router.get('/details', reportController.getDetails);

router.get('/demo/unsafe-search', reportController.unsafeSearch);
router.get('/demo/safe-search', reportController.safeSearch);

router.get('/:id/details', reportController.getDetailsById);

router.get('/:id', reportController.getById);

router.post('/', validateReport, reportController.create);

router.put('/:id', reportController.update);

router.delete('/:id', reportController.delete);

export default router;
