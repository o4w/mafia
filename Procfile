web: python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn tekmafya.wsgi --bind 0.0.0.0:$PORT --workers 2 --timeout 120
worker: celery -A tekmafya worker --loglevel=info --concurrency=2
beat: celery -A tekmafya beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
