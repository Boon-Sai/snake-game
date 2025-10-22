import pygame
import sys
import random
from tones import SINE_WAVE
from tones.mixer import Mixer

# Initialize Pygame and Mixer
pygame.init()
mixer = Mixer(44100, 0.5)
mixer.create_track(0, SINE_WAVE, attack=0.01, decay=0.1)

# Screen dimensions and grid settings
SCREEN_WIDTH = 600
SCREEN_HEIGHT = 600
GRID_SIZE = 30
GRID_WIDTH = SCREEN_WIDTH // GRID_SIZE
GRID_HEIGHT = SCREEN_HEIGHT // GRID_SIZE

# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GRAY = (50, 50, 50)
GREEN = (46, 139, 87)
DARK_GREEN = (0, 100, 0)
RED = (255, 0, 0)
FLASH_COLOR = (150, 150, 150)

# Fonts
UI_FONT = pygame.font.Font(None, 48)
SCORE_FONT = pygame.font.Font(None, 36)

# Highscore file
HIGHSCORE_FILE = "highscore.txt"

# Setup the display
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("Snake Game")
clock = pygame.time.Clock()

class SoundManager:
    def __init__(self):
        self.eat_sound = self._create_sound("g#", 5, 0.1)
        self.game_over_sound = self._create_sound("c", 3, 0.3)

    def _create_sound(self, note, octave, duration):
        mixer.add_note(0, note=note, octave=octave, duration=duration)
        samples = mixer.mix()
        mixer.remove_last_note(0)
        return pygame.mixer.Sound(buffer=samples)

    def play_eat_sound(self):
        self.eat_sound.play()

    def play_game_over_sound(self):
        self.game_over_sound.play()

def load_high_score():
    try:
        with open(HIGHSCORE_FILE, "r") as f:
            return int(f.read())
    except (IOError, ValueError):
        return 0

def save_high_score(score):
    with open(HIGHSCORE_FILE, "w") as f:
        f.write(str(score))

class Snake:
    def __init__(self):
        self.body = [(GRID_WIDTH // 2, GRID_HEIGHT // 2)]
        self.direction = (1, 0)
        self.grow = False

    def move(self):
        head = self.body[0]
        dx, dy = self.direction
        new_head = ((head[0] + dx), (head[1] + dy))

        if new_head in self.body[1:] or not (0 <= new_head[0] < GRID_WIDTH and 0 <= new_head[1] < GRID_HEIGHT):
            return False  # Collision

        self.body.insert(0, new_head)
        if not self.grow:
            self.body.pop()
        else:
            self.grow = False
        return True

    def change_direction(self, new_direction):
        if (new_direction[0] * -1, new_direction[1] * -1) != self.direction:
            self.direction = new_direction

    def grow_snake(self):
        self.grow = True

    def draw(self, surface):
        for i, segment in enumerate(self.body):
            rect = pygame.Rect(segment[0] * GRID_SIZE, segment[1] * GRID_SIZE, GRID_SIZE, GRID_SIZE)
            color = DARK_GREEN if i == 0 else GREEN
            pygame.draw.rect(surface, color, rect, border_radius=5)

class Fruit:
    def __init__(self, snake_body):
        self.position = self.randomize_position(snake_body)

    def randomize_position(self, snake_body):
        while True:
            pos = (random.randint(0, GRID_WIDTH - 1), random.randint(0, GRID_HEIGHT - 1))
            if pos not in snake_body:
                return pos

    def draw(self, surface):
        rect = pygame.Rect(self.position[0] * GRID_SIZE, self.position[1] * GRID_SIZE, GRID_SIZE, GRID_SIZE)
        pygame.draw.rect(surface, RED, rect, border_radius=8)

def draw_grid(surface):
    for y in range(0, SCREEN_HEIGHT, GRID_SIZE):
        for x in range(0, SCREEN_WIDTH, GRID_SIZE):
            rect = pygame.Rect(x, y, GRID_SIZE, GRID_SIZE)
            pygame.draw.rect(surface, GRAY, rect, 1)

def draw_score(surface, score):
    score_text = SCORE_FONT.render(f"Score: {score}", True, WHITE)
    surface.blit(score_text, (10, 10))

def show_start_screen(high_score):
    last_blink_time = 0
    show_text = True
    waiting = True
    while waiting:
        screen.fill(BLACK)
        title_text = UI_FONT.render("Snake Game", True, GREEN)
        start_text = SCORE_FONT.render("Press any key to start", True, WHITE)
        highscore_text = SCORE_FONT.render(f"High Score: {high_score}", True, WHITE)

        title_rect = title_text.get_rect(center=(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 50))
        start_rect = start_text.get_rect(center=(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 50))
        highscore_rect = highscore_text.get_rect(center=(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 100))

        screen.blit(title_text, title_rect)
        screen.blit(highscore_text, highscore_rect)

        # Blinking text
        current_time = pygame.time.get_ticks()
        if current_time - last_blink_time > 500:
            show_text = not show_text
            last_blink_time = current_time
        if show_text:
            screen.blit(start_text, start_rect)

        pygame.display.flip()

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN:
                waiting = False

def show_game_over_screen(score, high_score):
    last_blink_time = 0
    show_text = True
    waiting = True
    while waiting:
        screen.fill(BLACK)
        game_over_text = UI_FONT.render("Game Over", True, RED)
        score_text = SCORE_FONT.render(f"Final Score: {score}", True, WHITE)
        highscore_text = SCORE_FONT.render(f"High Score: {high_score}", True, WHITE)
        restart_text = SCORE_FONT.render("Press any key to play again", True, WHITE)

        game_over_rect = game_over_text.get_rect(center=(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 100))
        score_rect = score_text.get_rect(center=(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 50))
        highscore_rect = highscore_text.get_rect(center=(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2))
        restart_rect = restart_text.get_rect(center=(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 50))

        screen.blit(game_over_text, game_over_rect)
        screen.blit(score_text, score_rect)
        screen.blit(highscore_text, highscore_rect)

        # Blinking text
        current_time = pygame.time.get_ticks()
        if current_time - last_blink_time > 500:
            show_text = not show_text
            last_blink_time = current_time
        if show_text:
            screen.blit(restart_text, restart_rect)

        pygame.display.flip()

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN:
                waiting = False

def main():
    sound_manager = SoundManager()
    high_score = load_high_score()
    show_start_screen(high_score)
    while True:
        snake = Snake()
        fruit = Fruit(snake.body)
        score = 0
        game_over = False
        screen_flash = 0

        while not game_over:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit()
                elif event.type == pygame.KEYDOWN:
                    if event.key in [pygame.K_UP, pygame.K_w]:
                        snake.change_direction((0, -1))
                    elif event.key in [pygame.K_DOWN, pygame.K_s]:
                        snake.change_direction((0, 1))
                    elif event.key in [pygame.K_LEFT, pygame.K_a]:
                        snake.change_direction((-1, 0))
                    elif event.key in [pygame.K_RIGHT, pygame.K_d]:
                        snake.change_direction((1, 0))

            if not snake.move():
                sound_manager.play_game_over_sound()
                game_over = True

            if snake.body[0] == fruit.position:
                snake.grow_snake()
                fruit.position = fruit.randomize_position(snake.body)
                score += 1
                screen_flash = 5
                sound_manager.play_eat_sound()

            screen.fill(BLACK)
            draw_grid(screen)
            snake.draw(screen)
            fruit.draw(screen)
            draw_score(screen, score)

            if screen_flash > 0:
                flash_surface = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
                flash_surface.set_alpha(128)
                flash_surface.fill(FLASH_COLOR)
                screen.blit(flash_surface, (0, 0))
                screen_flash -= 1

            pygame.display.flip()

            clock.tick(10)

        if score > high_score:
            high_score = score
            save_high_score(high_score)
        show_game_over_screen(score, high_score)

if __name__ == "__main__":
    main()
