import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  Offeringlist = false;
  mobileMenuOpen = false;
  private currentTime = new Date();
  private timeInterval: any;

  ngOnInit() {
    this.timeInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  open() {
    this.Offeringlist = true;
  }

  close() {
    this.Offeringlist = false;
  }

  livelink() {
    window.open(
      'https://www.youtube.com/@stthomaschurch2337/streams',
      '_blank'
    );
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  scrollToServices() {
    const element = document.getElementById('services');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  getCurrentServiceText(): string {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay();

    if (currentDay === 0 && currentHour >= 9 && currentHour < 11) {
      return 'Sunday Service in Progress';
    }

    if (currentHour === 18 && currentMinute >= 30) {
      return 'Daily Night Prayer in Progress';
    }
    if (currentHour === 19 && currentMinute <= 30) {
      return 'Daily Night Prayer in Progress';
    }

    if (this.isAllNightPrayerNight()) {
      return 'All Night Prayer Tonight';
    }

    if (this.isFastingPrayerToday()) {
      return 'Fasting Prayer Today at 12 PM';
    }

    return 'Join us for upcoming services';
  }

  getNextService(): string {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentHour < 18 || (currentHour === 18 && currentMinute < 30)) {
      return 'Daily Night Prayer';
    }

    if (currentDay === 0 && currentHour < 9) {
      return 'Sunday Service';
    }

    if (this.isFastingPrayerToday() && currentHour < 12) {
      return 'Fasting Prayer';
    }

    return 'Sunday Service';
  }

  getTimeUntilNextService(): string {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentHour < 18 || (currentHour === 18 && currentMinute < 30)) {
      const timeUntil = this.calculateTimeUntil(18, 30);
      return `Today at 6:30 PM (${timeUntil})`;
    }

    if (currentDay === 0 && currentHour < 9) {
      const timeUntil = this.calculateTimeUntil(9, 0);
      return `Today at 9:00 AM (${timeUntil})`;
    }

    const daysUntilSunday = (7 - currentDay) % 7 || 7;
    if (daysUntilSunday === 1) {
      return 'Tomorrow at 9:00 AM';
    }
    return `${daysUntilSunday} days at 9:00 AM`;
  }

  private calculateTimeUntil(targetHour: number, targetMinute: number): string {
    const now = new Date();
    const target = new Date();
    target.setHours(targetHour, targetMinute, 0, 0);

    const diff = target.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  private isAllNightPrayerNight(): boolean {
    const now = new Date();
    const currentDate = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const firstDay = new Date(currentYear, currentMonth, 1);
    const firstSaturday = new Date(firstDay);
    firstSaturday.setDate(1 + ((6 - firstDay.getDay()) % 7));

    const thirdSaturday = new Date(firstSaturday);
    thirdSaturday.setDate(firstSaturday.getDate() + 14);

    return currentDate === thirdSaturday.getDate() && now.getDay() === 6;
  }

  private isFastingPrayerToday(): boolean {
    const now = new Date();
    const currentDate = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const firstDay = new Date(currentYear, currentMonth, 1);
    const firstSunday = new Date(firstDay);
    firstSunday.setDate(1 + ((7 - firstDay.getDay()) % 7));

    const secondSunday = new Date(firstSunday);
    secondSunday.setDate(firstSunday.getDate() + 7);

    return currentDate === secondSunday.getDate() && now.getDay() === 0;
  }

  getNextFastingPrayer(): Date {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const firstDay = new Date(currentYear, currentMonth, 1);
    const firstSunday = new Date(firstDay);
    firstSunday.setDate(1 + ((7 - firstDay.getDay()) % 7));

    const secondSunday = new Date(firstSunday);
    secondSunday.setDate(firstSunday.getDate() + 7);
    secondSunday.setHours(12, 0, 0, 0);

    if (secondSunday < now) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

      const nextFirstDay = new Date(nextYear, nextMonth, 1);
      const nextFirstSunday = new Date(nextFirstDay);
      nextFirstSunday.setDate(1 + ((7 - nextFirstDay.getDay()) % 7));

      const nextSecondSunday = new Date(nextFirstSunday);
      nextSecondSunday.setDate(nextFirstSunday.getDate() + 7);
      nextSecondSunday.setHours(12, 0, 0, 0);

      return nextSecondSunday;
    }

    return secondSunday;
  }

  getNextAllNightPrayer(): Date {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const firstDay = new Date(currentYear, currentMonth, 1);
    const firstSaturday = new Date(firstDay);
    firstSaturday.setDate(1 + ((6 - firstDay.getDay()) % 7));

    const thirdSaturday = new Date(firstSaturday);
    thirdSaturday.setDate(firstSaturday.getDate() + 14);
    thirdSaturday.setHours(20, 0, 0, 0);

    if (thirdSaturday < now) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

      const nextFirstDay = new Date(nextYear, nextMonth, 1);
      const nextFirstSaturday = new Date(nextFirstDay);
      nextFirstSaturday.setDate(1 + ((6 - nextFirstDay.getDay()) % 7));

      const nextThirdSaturday = new Date(nextFirstSaturday);
      nextThirdSaturday.setDate(nextFirstSaturday.getDate() + 14);
      nextThirdSaturday.setHours(20, 0, 0, 0);

      return nextThirdSaturday;
    }

    return thirdSaturday;
  }

  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('en-US', options);
  }

  getChurchAnnouncements(): string[] {
    return [
      'Welcome to St Thomas Church, Sonanganvilai',
      'Join us for Daily Night Prayer at 6:30 PM',
      'Sunday Service: First Bell 8:30 AM, Service 9:00 AM',
      'Fasting Prayer: Second Sunday of every month at 12:00 PM',
      'All Night Prayer: Third Saturday of every month',
      'Parish Priest: Rev. Fr. Daniel Gnynapragasham',
      'Sabha Uliyar: Naveen Christopher',
    ];
  }

  isChurchOpen(): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay();

    if (currentDay === 0) {
      if (
        (currentHour === 8 && currentMinute >= 30) ||
        (currentHour >= 9 && currentHour < 11)
      ) {
        return true;
      }
    }

    if (
      (currentHour === 18 && currentMinute >= 30) ||
      (currentHour === 19 && currentMinute <= 30)
    ) {
      return true;
    }

    if (this.isFastingPrayerToday()) {
      if (currentHour >= 12 && currentHour < 14) {
        return true;
      }
    }

    if (this.isAllNightPrayerNight()) {
      if (currentHour >= 20 || currentHour < 6) {
        return true;
      }
    }

    return false;
  }

  getCurrentServiceStatus(): string {
    if (this.isChurchOpen()) {
      return 'Service in Progress';
    }
    return 'Church Closed';
  }

  contactChurch() {
    alert(
      'For urgent matters, please contact the Parish Office during service hours or reach out to our Sabha Uliyar: Naveen Christopher'
    );
  }

  subscribeToNotifications() {
    alert(
      'Notification service will be available soon. You will be notified about special services and events.'
    );
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
  showScrollButton = false;
  private scrollThreshold = 300;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showScrollButton =
      (window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0) > this.scrollThreshold;
  }
}
