import { Router } from 'express';
import { reportController } from '../controllers/report.controller.js';
import { validateReport } from '../middlewares/validate-report.middleware.js';

const router = Router();

router.get('/', reportController.getAll);

router.get('/stats', reportController.getStats);

router.get('/details', reportController.getDetails);

router.get('/demo/unsafe-search', reportController.unsafeSearch);

router.get('/:id/details', reportController.getDetailsById);

router.get('/:id', reportController.getById);

router.post('/', validateReport, reportController.create);

router.put('/:id', reportController.update);

router.delete('/:id', reportController.delete);

export default router;
