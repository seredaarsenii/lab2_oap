import { Router } from 'express';
import { reportController } from '../controllers/report.controller.js';
import { validateReport } from '../middlewares/validate-report.middleware.js';

const router = Router();

router.get('/', reportController.getAll);

router.get('/:id', reportController.getById);

router.post('/', validateReport, reportController.create);

router.put('/:id', reportController.update);

router.delete('/:id', reportController.delete);

export default router;
