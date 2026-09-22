#!/usr/bin/env python
"""Quick test to verify backend setup"""

from app import create_app

try:
    app = create_app()
    print('✓ App created successfully')
    print(f'✓ Database URL: {app.config.get("SQLALCHEMY_DATABASE_URI")}')
    print('✓ All imports working!')
    
    # List all routes
    print('\n✓ Registered API Routes:')
    routes = []
    for rule in app.url_map.iter_rules():
        if 'api' in str(rule):
            routes.append(str(rule))
    
    for route in sorted(routes)[:20]:
        print(f'  - {route}')
    
    if len(routes) > 20:
        print(f'  ... and {len(routes) - 20} more routes')
    
    print(f'\n✓ Total routes: {len(routes)}')
except Exception as e:
    print(f'✗ Error: {e}')
    import traceback
    traceback.print_exc()
