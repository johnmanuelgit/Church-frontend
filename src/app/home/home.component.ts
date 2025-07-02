import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  Offeringlist = false;
  mobileMenuOpen = false;
  private currentTime = new Date();
  private timeInterval: any;

  ngOnInit() {
    // Update time every minute
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
    window.open('https://www.youtube.com/@stthomaschurch2337/streams', '_blank');
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
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Check if it's during Sunday service (9:00 AM - 11:00 AM)
    if (currentDay === 0 && currentHour >= 9 && currentHour < 11) {
      return 'Sunday Service in Progress';
    }
    
    // Check if it's during daily night prayer (6:30 PM - 7:30 PM)
    if (currentHour === 18 && currentMinute >= 30) {
      return 'Daily Night Prayer in Progress';
    }
    if (currentHour === 19 && currentMinute <= 30) {
      return 'Daily Night Prayer in Progress';
    }
    
    // Check for special services
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
    
    // If it's before daily night prayer today
    if (currentHour < 18 || (currentHour === 18 && currentMinute < 30)) {
      return 'Daily Night Prayer';
    }
    
    // If it's Sunday and before service
    if (currentDay === 0 && currentHour < 9) {
      return 'Sunday Service';
    }
    
    // Check for special services
    if (this.isFastingPrayerToday() && currentHour < 12) {
      return 'Fasting Prayer';
    }
    
    // Default to next Sunday
    return 'Sunday Service';
  }

  getTimeUntilNextService(): string {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Calculate time until daily night prayer
    if (currentHour < 18 || (currentHour === 18 && currentMinute < 30)) {
      const timeUntil = this.calculateTimeUntil(18, 30);
      return `Today at 6:30 PM (${timeUntil})`;
    }
    
    // Calculate time until Sunday service
    if (currentDay === 0 && currentHour < 9) {
      const timeUntil = this.calculateTimeUntil(9, 0);
      return `Today at 9:00 AM (${timeUntil})`;
    }
    
    // Calculate days until next Sunday
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
    
    // Find the third Saturday of the current month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const firstSaturday = new Date(firstDay);
    firstSaturday.setDate(1 + (6 - firstDay.getDay()) % 7);
    
    const thirdSaturday = new Date(firstSaturday);
    thirdSaturday.setDate(firstSaturday.getDate() + 14);
    
    return currentDate === thirdSaturday.getDate() && now.getDay() === 6;
  }

  private isFastingPrayerToday(): boolean {
    const now = new Date();
    const currentDate = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Find the second Sunday of the current month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const firstSunday = new Date(firstDay);
    firstSunday.setDate(1 + (7 - firstDay.getDay()) % 7);
    
    const secondSunday = new Date(firstSunday);
    secondSunday.setDate(firstSunday.getDate() + 7);
    
    return currentDate === secondSunday.getDate() && now.getDay() === 0;
  }

  // Auto-generated prayer schedule methods
  getNextFastingPrayer(): Date {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calculate second Sunday of current month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const firstSunday = new Date(firstDay);
    firstSunday.setDate(1 + (7 - firstDay.getDay()) % 7);
    
    const secondSunday = new Date(firstSunday);
    secondSunday.setDate(firstSunday.getDate() + 7);
    secondSunday.setHours(12, 0, 0, 0);
    
    // If this month's second Sunday has passed, get next month's
    if (secondSunday < now) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      
      const nextFirstDay = new Date(nextYear, nextMonth, 1);
      const nextFirstSunday = new Date(nextFirstDay);
      nextFirstSunday.setDate(1 + (7 - nextFirstDay.getDay()) % 7);
      
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
    
    // Calculate third Saturday of current month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const firstSaturday = new Date(firstDay);
    firstSaturday.setDate(1 + (6 - firstDay.getDay()) % 7);
    
    const thirdSaturday = new Date(firstSaturday);
    thirdSaturday.setDate(firstSaturday.getDate() + 14);
    thirdSaturday.setHours(20, 0, 0, 0); // Start at 8 PM
    
    // If this month's third Saturday has passed, get next month's
    if (thirdSaturday < now) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      
      const nextFirstDay = new Date(nextYear, nextMonth, 1);
      const nextFirstSaturday = new Date(nextFirstDay);
      nextFirstSaturday.setDate(1 + (6 - nextFirstDay.getDay()) % 7);
      
      const nextThirdSaturday = new Date(nextFirstSaturday);
      nextThirdSaturday.setDate(nextFirstSaturday.getDate() + 14);
      nextThirdSaturday.setHours(20, 0, 0, 0);
      
      return nextThirdSaturday;
    }
    
    return thirdSaturday;
  }

  // Utility method to format dates for display
  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
  }

  // Method to get church announcements (can be connected to a service later)
  getChurchAnnouncements(): string[] {
    return [
      'Welcome to St Thomas Church, Sonanganvilai',
      'Join us for Daily Night Prayer at 6:30 PM',
      'Sunday Service: First Bell 8:30 AM, Service 9:00 AM',
      'Fasting Prayer: Second Sunday of every month at 12:00 PM',
      'All Night Prayer: Third Saturday of every month',
      'Parish Priest: Rev. Fr. Daniel Gnynapragasham',
      'Sabha Uliyar: Naveen Christopher'
    ];
  }

  // Method to check if church is currently open
  isChurchOpen(): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay();
    
    // Sunday service hours
    if (currentDay === 0) {
      if ((currentHour === 8 && currentMinute >= 30) || 
          (currentHour >= 9 && currentHour < 11)) {
        return true;
      }
    }
    
    // Daily night prayer hours
    if ((currentHour === 18 && currentMinute >= 30) || 
        (currentHour === 19 && currentMinute <= 30)) {
      return true;
    }
    
    // Special service times
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

  // Method to get the current service status
  getCurrentServiceStatus(): string {
    if (this.isChurchOpen()) {
      return 'Service in Progress';
    }
    return 'Church Closed';
  }

  // Method to handle emergency prayer requests or contact
  contactChurch() {
    // This can be extended to open a contact form or show contact details
    alert('For urgent matters, please contact the Parish Office during service hours or reach out to our Sabha Uliyar: Naveen Christopher');
  }

  // Method to subscribe to church notifications (placeholder for future implementation)
  subscribeToNotifications() {
    // This can be connected to a notification service
    alert('Notification service will be available soon. You will be notified about special services and events.');
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' 
    });
  }
 showScrollButton = false;
  private scrollThreshold = 300;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showScrollButton = (window.pageYOffset || 
                            document.documentElement.scrollTop || 
                            document.body.scrollTop || 0) > this.scrollThreshold;
  }
}