import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from test_security import (
    test_health_check,
    test_public_can_read_menu,
    test_unauthenticated_cannot_create_menu_item,
    test_unauthenticated_cannot_delete_menu_item,
    test_unauthenticated_cannot_toggle_stock,
    test_admin_login_and_authenticated_mutation
)

tests = [
    ("test_health_check", test_health_check),
    ("test_public_can_read_menu", test_public_can_read_menu),
    ("test_unauthenticated_cannot_create_menu_item", test_unauthenticated_cannot_create_menu_item),
    ("test_unauthenticated_cannot_delete_menu_item", test_unauthenticated_cannot_delete_menu_item),
    ("test_unauthenticated_cannot_toggle_stock", test_unauthenticated_cannot_toggle_stock),
    ("test_admin_login_and_authenticated_mutation", test_admin_login_and_authenticated_mutation)
]

print("=== RUNNING FASTAPI SECURITY & ROLE VERIFICATION TESTS ===")
passed = 0
failed = 0

for name, test_fn in tests:
    try:
        test_fn()
        print(f"[PASS]: {name}")
        passed += 1
    except AssertionError as e:
        print(f"[FAIL]: {name} (AssertionError: {e})")
        failed += 1
    except Exception as e:
        print(f"[ERROR]: {name} ({type(e).__name__}: {e})")
        failed += 1

print(f"\nSummary: {passed} PASSED, {failed} FAILED out of {len(tests)} tests.")
if failed > 0:
    sys.exit(1)
