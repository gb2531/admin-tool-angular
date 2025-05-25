import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  isMenuCollapsed = false;
  isHoverExpanded = false;
  isProfileDropdownOpen = false;

  constructor(private router: Router) { }

  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent) {
    const profileDropdown = (event.target as HTMLElement).closest('.profile-dropdown');
    if (!profileDropdown) {
      this.isProfileDropdownOpen = false;
    }
  }

  toggleMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
    if (!this.isMenuCollapsed) {
      this.isHoverExpanded = false;
    }
  }

  onMenuHover(isHovering: boolean): void {
    if (this.isMenuCollapsed) {
      this.isHoverExpanded = isHovering;
    }
  }

  toggleProfileDropdown(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  signOut(): void {
    // Implement sign out logic here
    console.log('Signing out...');
    this.router.navigate(['/auth']);
  }
} 