"""
Rate limiting service for authentication endpoints.

This module provides:
- IP-based rate limiting for authentication attempts
- Email-based rate limiting for failed login attempts
- Account lockout management
- Automatic lockout expiration
"""

from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List
import threading


class RateLimiter:
    """
    Rate limiter for authentication endpoints.

    Tracks failed login attempts by email address and enforces
    account lockout after exceeding the maximum attempts.

    Thread-safe for concurrent requests.
    """

    def __init__(self, max_attempts: int = 5, lockout_minutes: int = 15):
        """
        Initialize rate limiter.

        Args:
            max_attempts: Maximum failed attempts before lockout (default: 5)
            lockout_minutes: Lockout duration in minutes (default: 15)
        """
        self.max_attempts = max_attempts
        self.lockout_duration = timedelta(minutes=lockout_minutes)
        self.attempts: Dict[str, List[datetime]] = defaultdict(list)
        self.lock = threading.Lock()

    def is_locked(self, email: str) -> bool:
        """
        Check if email is locked due to failed attempts.

        Args:
            email: User's email address

        Returns:
            True if locked, False otherwise

        Thread-safe: Uses lock for concurrent access.
        """
        with self.lock:
            now = datetime.utcnow()

            # Clean old attempts (outside lockout window)
            self.attempts[email] = [
                attempt for attempt in self.attempts[email]
                if now - attempt < self.lockout_duration
            ]

            # Check if locked
            return len(self.attempts[email]) >= self.max_attempts

    def record_failed_attempt(self, email: str) -> None:
        """
        Record a failed login attempt.

        Args:
            email: User's email address

        Thread-safe: Uses lock for concurrent access.
        """
        with self.lock:
            self.attempts[email].append(datetime.utcnow())

    def clear_attempts(self, email: str) -> None:
        """
        Clear attempts on successful login.

        Args:
            email: User's email address

        Thread-safe: Uses lock for concurrent access.
        """
        with self.lock:
            self.attempts[email] = []

    def get_remaining_attempts(self, email: str) -> int:
        """
        Get remaining attempts before lockout.

        Args:
            email: User's email address

        Returns:
            Number of remaining attempts (0 if locked)

        Thread-safe: Uses lock for concurrent access.
        """
        with self.lock:
            now = datetime.utcnow()

            # Clean old attempts
            self.attempts[email] = [
                attempt for attempt in self.attempts[email]
                if now - attempt < self.lockout_duration
            ]

            current_attempts = len(self.attempts[email])
            return max(0, self.max_attempts - current_attempts)

    def get_lockout_expiry(self, email: str) -> datetime | None:
        """
        Get lockout expiration time.

        Args:
            email: User's email address

        Returns:
            Expiration datetime if locked, None otherwise

        Thread-safe: Uses lock for concurrent access.
        """
        with self.lock:
            if not self.is_locked(email):
                return None

            # Get oldest attempt in current window
            if self.attempts[email]:
                oldest_attempt = min(self.attempts[email])
                return oldest_attempt + self.lockout_duration

            return None


# Global rate limiter instance
rate_limiter = RateLimiter(max_attempts=5, lockout_minutes=15)
